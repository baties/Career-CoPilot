import { ImportLinkedInProfileResponse } from "@workspace/api-zod";

/** Strictly allow member-profile URLs; never fetch a user-supplied host. */
export function normalizeLinkedInUrl(value: string): string {
  const input = value.trim();
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !/^(?:www\.|[a-z]{2}\.)?linkedin\.com$/i.test(url.hostname) ||
      !/^\/in\/[a-z0-9_%\-]+\/?$/i.test(url.pathname)) {
    throw new Error("Enter a LinkedIn member profile URL, such as https://www.linkedin.com/in/your-profile.");
  }
  return `https://www.linkedin.com${url.pathname.replace(/\/$/, "")}`;
}

export function extractLinkedInProfile(payload: unknown) {
  const data = (payload as { data?: Record<string, unknown> } | null)?.data;
  if (!data || typeof data !== "object") throw new Error("Invalid provider response");
  const name = typeof data.full_name === "string" ? data.full_name.trim().slice(0, 100) : "";
  const seen = new Set<string>();
  const skills: string[] = [];
  if (Array.isArray(data.skills)) {
    for (const raw of data.skills) {
      if (typeof raw !== "string") continue;
      const skill = raw.trim().replace(/\s+/g, " ").slice(0, 50);
      if (!skill || seen.has(skill.toLowerCase())) continue;
      seen.add(skill.toLowerCase());
      skills.push(skill);
    }
  }
  return ImportLinkedInProfileResponse.parse({ name, skills, detectedSkillCount: skills.length });
}

export function providerError(status: number): string {
  switch (status) {
    case 404: return "No matching profile was found. Try your LinkedIn PDF or pasted profile text instead.";
    case 401:
    case 403: return "The profile-data connection needs attention. Use PDF or text import while the app owner checks the connection.";
    case 402: return "The provider account has reached its credit limit. Use PDF or pasted text instead.";
    case 429: return "The profile-data provider is temporarily rate-limited. Please try later or use PDF/text import.";
    default: return "The profile-data provider is unavailable. Please try later or use PDF/text import.";
  }
}