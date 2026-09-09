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
];

const CONTACT_OR_HEADING =
  /@|https?:|linkedin|github|resume|curriculum|vitae|summary|profile|objective|experience|education|skills/i;

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

  return SKILL_ALIASES
    .filter(([, aliases]) =>
      aliases.some((alias) => {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').test(normalized);
      }),
    )
    .map(([skill]) => skill)
    .slice(0, 10);
}

export interface ParsedResume {
  name: string;
  skills: string[];
}

export async function parseResumePdf(file: File): Promise<ParsedResume> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;
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

  return {
    name: extractLikelyName(lines),
    skills: extractSkills(text),
  };
}