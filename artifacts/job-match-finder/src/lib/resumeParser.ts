import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

const SKILL_ALIASES: Array<[string, string[]]> = [
  ['JavaScript', ['javascript', 'es6']],
  ['TypeScript', ['typescript']],
  ['React', ['react', 'react.js', 'reactjs']],
  ['Angular', ['angular']],
  ['Vue.js', ['vue', 'vue.js', 'vuejs']],
  ['Node.js', ['node.js', 'nodejs']],
  ['Python', ['python']],
  ['Java', ['java']],
  ['C#', ['c#', 'c sharp']],
  ['C++', ['c++']],
  ['Go', ['golang']],
  ['Ruby', ['ruby']],
  ['PHP', ['php']],
  ['Swift', ['swift']],
  ['Kotlin', ['kotlin']],
  ['SQL', ['sql']],
  ['PostgreSQL', ['postgresql', 'postgres']],
  ['MySQL', ['mysql']],
  ['MongoDB', ['mongodb']],
  ['AWS', ['aws', 'amazon web services']],
  ['Azure', ['azure']],
  ['Google Cloud', ['google cloud', 'gcp']],
  ['Docker', ['docker']],
  ['Kubernetes', ['kubernetes']],
  ['Git', ['git']],
  ['REST APIs', ['rest api', 'restful']],
  ['GraphQL', ['graphql']],
  ['HTML', ['html']],
  ['CSS', ['css']],
  ['Tailwind CSS', ['tailwind']],
  ['Next.js', ['next.js', 'nextjs']],
  ['Express', ['express.js', 'expressjs']],
  ['Django', ['django']],
  ['Flask', ['flask']],
  ['Spring Boot', ['spring boot']],
  ['TensorFlow', ['tensorflow']],
  ['PyTorch', ['pytorch']],
  ['Machine Learning', ['machine learning']],
  ['Data Analysis', ['data analysis', 'data analytics']],
  ['Power BI', ['power bi']],
  ['Tableau', ['tableau']],
  ['Excel', ['microsoft excel', 'excel']],
  ['Figma', ['figma']],
  ['Agile', ['agile']],
  ['Scrum', ['scrum']],
  ['Project Management', ['project management']],
  ['Communication', ['communication']],
  ['Leadership', ['leadership']],
  ['Customer Service', ['customer service']],
  ['Sales', ['sales']],
  ['Marketing', ['marketing']],
  ['Accounting', ['accounting']],
  ['Bookkeeping', ['bookkeeping']],
  ['Financial Analysis', ['financial analysis']],
  ['Graphic Design', ['graphic design']],
  ['UX Design', ['ux design', 'user experience design']],
  ['UI Design', ['ui design', 'user interface design']],
  ['Research', ['research']],
  ['Writing', ['writing']],
  ['Problem Solving', ['problem solving', 'problem-solving']],
  ['Teamwork', ['teamwork', 'team work']],
  ['Time Management', ['time management']],
  ['Microsoft Office', ['microsoft office']],
  ['SEO', ['seo', 'search engine optimization']],
];

const CONTACT_OR_HEADING =
  /@|https?:|linkedin|github|resume|curriculum|vitae|summary|profile|objective|experience|education|skills|developer|engineer|manager|designer|analyst/i;

function extractLikelyName(lines: string[]) {
  const candidates = lines.slice(0, 12);

  for (const line of candidates) {
    const cleaned = line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ');
    const looksLikeName =
      cleaned.length >= 3 &&
      cleaned.length <= 60 &&
      words.length >= 2 &&
      words.length <= 5 &&
      /^[\p{L}][\p{L}'’. -]+$/u.test(cleaned) &&
      !CONTACT_OR_HEADING.test(cleaned) &&
      !/\d/.test(cleaned);

    if (looksLikeName) return cleaned;
  }

  return '';
}

function extractSkills(text: string) {
  const normalized = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
  const explicitSkills: string[] = [];
  let inSkillsSection = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = line.match(/^(?:(?:technical|core|key|professional|additional|soft|hard)\s+)?skills(?:\s*(?:&|and)\s*(?:abilities|competencies))?\s*(?::|$)(.*)$/i);
    if (heading) inSkillsSection = true;
    else if (/^(?:work\s+)?experience\b|^education\b|^projects\b|^certifications\b|^summary\b|^interests\b|^references\b/i.test(line)) {
      inSkillsSection = false;
    }
    if (!inSkillsSection) continue;
    const content = heading ? heading[1] : line;
    for (const item of content.split(/[,;|•·\t]+/)) {
      const skill = item.trim().replace(/^[-–—*]\s*/, '').replace(/^(?:languages|frameworks|tools|databases|platforms)\s*:\s*/i, '').trim();
      if (!skill || skill.length > 50 || skill.split(/\s+/).length > 6 || /@|https?:|^\d/.test(skill)) continue;
      const alias = SKILL_ALIASES.find(([name, aliases]) =>
        [name.toLowerCase(), ...aliases].includes(skill.toLowerCase()));
      explicitSkills.push(alias?.[0] ?? skill);
    }
  }

  const recognizedSkills = SKILL_ALIASES
    .map(([skill, aliases]) => {
      let position = Infinity;
      aliases.forEach((alias) => {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').exec(normalized);
        if (match) position = Math.min(position, match.index);
      });
      return { skill, position };
    })
    .filter(({ position }) => Number.isFinite(position))
    .sort((a, b) => a.position - b.position)
    .map(({ skill }) => skill);
  const seen = new Set<string>();
  return [...explicitSkills, ...recognizedSkills].filter((skill) => {
    const key = skill.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface ParsedResume {
  name: string;
  skills: string[];
  detectedSkillCount: number;
}

export function parseResumeText(text: string): ParsedResume {
  if (!text.trim()) throw new Error('Paste your profile or resume text first.');
  if (text.length > 100_000) throw new Error('Please limit the profile text to 100,000 characters.');
  const skills = extractSkills(text);
  return {
    name: extractLikelyName(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)),
    skills,
    detectedSkillCount: skills.length,
  };
}

export async function parseResumePdf(file: File): Promise<ParsedResume> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data: bytes });
  try {
  const pdf = await loadingTask.promise;
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let currentLine = '';
    let previousY: number | null = null;

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5];
      if (previousY !== null && Math.abs(y - previousY) > 3 && currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      currentLine += `${item.str} `;
      previousY = y;
    }

    if (currentLine.trim()) lines.push(currentLine.trim());
  }

  const text = lines.join('\n');
  if (!text.trim()) {
    throw new Error('No readable text was found. Please use a text-based PDF rather than a scanned image.');
  }

  return parseResumeText(text);
  } finally {
    await loadingTask.destroy();
  }
}