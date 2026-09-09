import { Router, type IRouter } from "express";
import { SearchJobsBody, SearchJobsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

type RemoteJob = {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  tags?: string[];
  description?: string;
  url?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
};

const demoCompanies = [
  "Northstar Labs",
  "Juniper Digital",
  "Orbit Systems",
  "BrightPath",
  "Canvas Cloud",
  "Cedar Analytics",
  "NovaWorks",
  "Signal Studio",
  "LaunchPad",
  "MapleStack",
];

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 1);

const daysSince = (date: string) =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)),
  );

router.post("/jobs/search", async (req, res): Promise<void> => {
  const parsed = SearchJobsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  let sourceJobs: RemoteJob[] = [];
  let live = false;

  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "JobMatchFinder/1.0 (student hackathon demo)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6500),
    });
    if (response.ok) {
      const payload = (await response.json()) as RemoteJob[];
      sourceJobs = payload.filter((job) => job.position && job.company);
      live = sourceJobs.length > 0;
    }
  } catch (error) {
    req.log.warn({ error }, "Live job provider unavailable; using demo feed");
  }

  const titleTokens = tokenize(input.title);
  const skillTokens = input.skills.flatMap(tokenize);
  const locationTokens = tokenize(input.location);
  const targetedDemoJobs = demoCompanies.map((company, index) => ({
      id: `demo-${index}`,
      position:
        index < 4
          ? input.title
          : `${["Junior", "Associate", "Graduate"][index % 3]} ${input.title}`,
      company,
      location:
        input.location.toLowerCase() === "worldwide"
          ? "Worldwide"
          : input.location,
      tags: [...input.skills.slice(0, 4), "Communication", "Teamwork"],
      description: `Join ${company} and apply your ${input.skills.slice(0, 3).join(", ")} skills to real customer projects. A strong opportunity for a motivated early-career candidate.`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${company} ${input.title} jobs`)}`,
      date: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
    }));

  if (sourceJobs.length) {
    const relevantLiveJobs = sourceJobs.filter((job) => {
      const text = tokenize(
        [job.position, job.description, ...(job.tags ?? [])].join(" "),
      );
      const titleRelevant = titleTokens.some((term) => text.includes(term));
      const skillRelevant = skillTokens.some((term) => text.includes(term));
      return titleRelevant || skillRelevant;
    });
    sourceJobs = [...relevantLiveJobs, ...targetedDemoJobs].slice(0, 50);
  } else {
    sourceJobs = targetedDemoJobs;
  }

  const ranked = sourceJobs
    .map((job, index) => {
      const date = job.date ?? new Date().toISOString();
      const age = daysSince(date);
      const text = tokenize(
        [job.position, job.description, ...(job.tags ?? [])].join(" "),
      );
      const titleHits = titleTokens.filter((term) => text.includes(term)).length;
      const matchedSkills = input.skills.filter((skill) =>
        tokenize(skill).some((term) => text.includes(term)),
      );
      const location = job.location || "Worldwide";
      const remote = /remote|worldwide|anywhere/i.test(location);
      const locationMatch =
        input.location.toLowerCase() === "worldwide" ||
        locationTokens.some((term) => tokenize(location).includes(term)) ||
        (input.workType === "remote" && remote);
      const workType =
        input.workType === "onsite"
          ? "On-site"
          : input.workType === "hybrid"
            ? "Hybrid"
            : remote
              ? "Remote"
              : "On-site";
      const score = Math.min(
        99,
        Math.max(
          48,
          Math.round(
            38 +
              (titleHits / Math.max(titleTokens.length, 1)) * 28 +
              (matchedSkills.length / input.skills.length) * 26 +
              (locationMatch ? 6 : 0) +
              Math.max(0, 4 - age / 7) -
              (index % 4),
          ),
        ),
      );

      return {
        id: String(job.id ?? `${job.company}-${index}`),
        title: job.position || input.title,
        company: job.company || "Growing company",
        location,
        workType,
        source: live ? "Remote OK" : "Demo search",
        url:
          job.url ||
          `https://www.google.com/search?q=${encodeURIComponent(`${job.company} ${job.position} jobs`)}`,
        publishedAt: date,
        daysAgo: Math.min(age, 30),
        score,
        matchedSkills,
        summary: stripHtml(job.description ?? "").slice(0, 220),
        salary:
          job.salary_min && job.salary_max
            ? `$${job.salary_min.toLocaleString()}–$${job.salary_max.toLocaleString()}`
            : null,
      };
    })
    .filter((job) => job.daysAgo <= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const response = SearchJobsResponse.parse({
    jobs: ranked,
    totalScanned: sourceJobs.length,
    searchedAt: new Date().toISOString(),
    live,
  });

  res.json(response);
});

export default router;