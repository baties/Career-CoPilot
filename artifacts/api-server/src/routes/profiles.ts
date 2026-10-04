import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { ImportLinkedInProfileBody } from "@workspace/api-zod";
import { extractLinkedInProfile, normalizeLinkedInUrl, providerError } from "../lib/linkedinImport";

export function createProfilesRouter(connectors: Pick<ReplitConnectors, "proxy"> = new ReplitConnectors()): IRouter {
const router: IRouter = Router();
// Conservative, process-local limits for this anonymous app. No profile data is cached.
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
let windowStarted = Date.now();
let lookupsToday = 0;
let activeLookups = 0;
const clients = new Map<string, { started: number; count: number }>();

router.post("/profiles/linkedin", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = ImportLinkedInProfileBody.safeParse(req.body);
  if (!parsed.success || parsed.data.consent !== true) {
    res.status(400).json({ error: "Provide a profile URL and agree to the provider lookup first." });
    return;
  }
  let url: string;
  try {
    url = normalizeLinkedInUrl(parsed.data.url);
  } catch {
    res.status(400).json({ error: "Enter a valid HTTPS LinkedIn /in/ member profile URL." });
    return;
  }

  const now = Date.now();
  if (now - windowStarted >= DAY) {
    windowStarted = now;
    lookupsToday = 0;
  }
  for (const [key, value] of clients) {
    if (now - value.started >= HOUR) clients.delete(key);
  }
  // req.ip is not taken from an untrusted forwarded header; shared networks may share this limit.
  const key = req.ip ?? "unknown";
  const client = clients.get(key) ?? { started: now, count: 0 };
  if (lookupsToday >= 30 || client.count >= 5 || activeLookups >= 2 || clients.size >= 5000) {
    res.setHeader("Retry-After", "3600");
    res.status(429).json({ error: "The app's profile lookup limit is reached. Use PDF or pasted text, or try later." });
    return;
  }
  clients.set(key, { ...client, count: client.count + 1 });
  lookupsToday++;
  activeLookups++;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const params = new URLSearchParams({
      profile: url,
      data_include: "full_name,skills",
      min_likelihood: "6",
      titlecase: "true",
    });
    // Only this fixed provider endpoint is called; the LinkedIn page is never scraped.
    // SDK does not support AbortSignal. Hold the concurrency slot until the actual call settles,
    // even when the response to the browser times out, to avoid multiplying paid lookups.
    const lookup = (async () => {
      try {
        const response = await connectors.proxy("peopledatalabs", `/v5/person/enrich?${params}`, { method: "GET" });
        if (!response.ok) return { status: response.status, payload: null };
        return { status: 200, payload: await response.json() as unknown };
      } finally {
        activeLookups--;
      }
    })();
    const result = await Promise.race([
      lookup,
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 20000); }),
    ]);
    if (!result) {
      res.status(504).json({ error: "The profile lookup timed out. It may still consume a provider credit if matched. Use PDF or text rather than immediately retrying." });
      return;
    }
    if (result.status !== 200) {
      req.log.warn({ providerStatus: result.status }, "LinkedIn import provider rejected lookup");
      const status = [404, 429].includes(result.status) ? result.status : 502;
      res.status(status).json({ error: providerError(result.status) });
      return;
    }
    const profile = extractLinkedInProfile(result.payload);
    if (!profile.name && !profile.skills.length) {
      res.status(422).json({ error: "The matching record has no available name or skills. Use your LinkedIn PDF or pasted text instead." });
      return;
    }
    res.json(profile);
  } catch {
    // Do not log the profile URL, provider record, or SDK exception (may contain sensitive headers).
    req.log.warn("LinkedIn profile import failed");
    res.status(502).json({ error: "We could not complete the provider lookup. Use PDF or text import, or try later." });
  } finally {
    if (timer) clearTimeout(timer);
  }
});
return router;
}

export default createProfilesRouter();