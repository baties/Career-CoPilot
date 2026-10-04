import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { normalizeLinkedInUrl, extractLinkedInProfile } from "./linkedinImport";
import { createProfilesRouter } from "../routes/profiles";

test("member URL normalization strips tracking and accepts country hosts", () => {
  assert.equal(normalizeLinkedInUrl("linkedin.com/in/test-member/?trk=share"), "https://www.linkedin.com/in/test-member");
  assert.equal(normalizeLinkedInUrl("https://ca.linkedin.com/in/test-member"), "https://www.linkedin.com/in/test-member");
});

test("rejects non-member URLs and arbitrary fetch targets", () => {
  for (const url of ["https://linkedin.com.evil.test/in/person", "https://evil.test/in/person", "https://linkedin.com/company/test", "http://linkedin.com/in/person", "https://user:pass@linkedin.com/in/person", "https://linkedin.com:8080/in/person", "https://linkedin.com/in/person/other"]) {
    assert.throws(() => normalizeLinkedInUrl(url));
  }
});

test("only returns available name and deduplicated skills, never extra person data", () => {
  assert.deepEqual(extractLinkedInProfile({ data: { full_name: " Test Member ", skills: ["React", "react", null, " SQL ", "", 12], personal_emails: ["not-returned@example.test"] } }), {
    name: "Test Member", skills: ["React", "SQL"], detectedSkillCount: 2,
  });
  assert.deepEqual(extractLinkedInProfile({ data: {} }), { name: "", skills: [], detectedSkillCount: 0 });
  assert.throws(() => extractLinkedInProfile({}));
});

async function withApi(proxy: Parameters<typeof createProfilesRouter>[0], run: (post: (body: unknown) => Promise<Response>) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.log = { warn() {} } as unknown as typeof req.log; next(); });
  app.use("/api", createProfilesRouter(proxy));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run((body) => fetch(`http://127.0.0.1:${port}/api/profiles/linkedin`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }));
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const input = { url: "https://www.linkedin.com/in/test-member?trk=share", consent: true };

test("consent and URL validation block paid calls; successful response is bounded to requested fields", async () => {
  let calls = 0;
  await withApi({ proxy: async (provider, path) => {
    calls++;
    assert.equal(provider, "peopledatalabs");
    const url = new URL(path, "https://api.peopledatalabs.com");
    assert.equal(url.pathname, "/v5/person/enrich");
    assert.equal(url.searchParams.get("profile"), "https://www.linkedin.com/in/test-member");
    assert.equal(url.searchParams.get("data_include"), "full_name,skills");
    return Response.json({ data: { full_name: "Test Member", skills: ["React", "SQL"] } });
  } }, async (post) => {
    assert.equal((await post({ ...input, consent: false })).status, 400);
    assert.equal((await post({ ...input, url: "https://example.test/in/anything" })).status, 400);
    assert.equal(calls, 0);
    const result = await post(input);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.deepEqual(await result.json(), { name: "Test Member", skills: ["React", "SQL"], detectedSkillCount: 2 });
    assert.equal(calls, 1);
  });
});

test("provider failures are explicit, with no automatic app retries", async () => {
  for (const [status, expected] of [[404, 404], [401, 502], [402, 502], [429, 429], [500, 502]]) {
    let calls = 0;
    await withApi({ proxy: async () => { calls++; return Response.json({ error: "private provider details" }, { status }); } }, async (post) => {
      const result = await post(input);
      assert.equal(result.status, expected);
      const body = await result.json() as { error: string };
      assert.equal(typeof body.error, "string");
      assert.ok(!body.error.includes("private provider details"));
      assert.equal(calls, 1);
    });
  }
});

test("empty records fail explicitly, while a name-only record can be imported", async () => {
  await withApi({ proxy: async () => Response.json({ data: {} }) }, async (post) => {
    assert.equal((await post(input)).status, 422);
  });
  await withApi({ proxy: async () => Response.json({ data: { full_name: "Test Member" } }) }, async (post) => {
    const result = await post(input);
    assert.equal(result.status, 200);
    assert.equal((await result.json() as { skills: string[] }).skills.length, 0);
  });
});

test("anonymous lookup limit stops further paid calls", async () => {
  let calls = 0;
  await withApi({ proxy: async () => { calls++; return Response.json({ data: { skills: ["React"] } }); } }, async (post) => {
    for (let i = 0; i < 5; i++) assert.equal((await post(input)).status, 200);
    assert.equal((await post(input)).status, 429);
    assert.equal(calls, 5);
  });
});