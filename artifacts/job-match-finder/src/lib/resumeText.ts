import { AMBIGUOUS_PROSE_SKILLS, SKILL_ALIASES } from './skillCatalog';

export interface ParsedResume {
  name: string;
  skills: string[];
  detectedSkillCount: number;
}

const clean = (value: string) => value.replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim();
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const aliasPattern = (value: string) => escape(value).replace(/\s+/g, '\\s+');

export function canonicalSkill(value: string) {
  const normalized = clean(value).toLowerCase();
  return SKILL_ALIASES.find(([name, aliases]) =>
    [name.toLowerCase(), ...aliases].includes(normalized))?.[0];
}

const SKILL_HEADING = /^(?:(?:top|technical|core|key|professional|additional|soft|hard|relevant)\s+)?(?:skills(?:\s*(?:&|and)\s*(?:abilities|competencies|endorsements))?|competencies|expertise|technologies|tech(?:nology)?\s+stack|areas\s+of\s+expertise|core\s+(?:areas|competencies))\s*(?::|\t|$)(.*)$/i;
const CORE_INLINE = /\b(?:core areas|key skills|technical expertise|skills include|technologies used)\s*:\s*/i;
const SECTION_END = /^(?:(?:work|professional|employment)\s+)?experience\b|^education\b|^projects?\s*(?::|$)|^certifications?\b|^certificates?\b|^languages\b|^contact\b|^summary\b|^about\b|^profile\b|^interests\b|^references\b|^honors\b|^awards\b|^\[Column break\]$/i;
const NARRATIVE = /(?:I|We)\s+(?:remain|have|am|are|work|also|support|speciali[sz]e)\b|(?:My|Our)\s+(?:experience|work|focus)\b|\bOpen to\b/i;
const CATEGORY = /^(?:programming\s+languages|languages|frameworks|tools|databases|platforms|methodologies|libraries|cloud)\s*:\s*/i;

function declaredSkills(block: string) {
  const output: string[] = [];
  for (const raw of block.split(/[,;|•·●▪\t]+/)) {
    const lines = raw.split(/\n/).map((line) =>
      clean(line.replace(/^\s*[-–—*]\s*/, '').replace(CATEGORY, ''))).filter(Boolean);
    // A single named skill may wrap onto another PDF line.
    const combined = canonicalSkill(lines.join(' '));
    const values = combined ? [combined] : lines;
    for (const value of values) {
      for (const part of value.split(/\s*\/\s*/)) {
        // Keep slash names such as CI/CD intact; split lists such as ERC-20 / ERC-721.
        const skill = canonicalSkill(value) ?? canonicalSkill(part) ?? part;
        if (!skill || skill.length > 50 || skill.split(/\s+/).length > 7 ||
            /@|https?:|www\.|^\d|[.!?]$|\b(?:years?|months?|professional working|native or bilingual|limited working|certificate|course)\b/i.test(skill) ||
            /^(?:and|or|with|using|including|for|to)\b/i.test(skill) ||
            NARRATIVE.test(skill) || SKILL_HEADING.test(skill) || SECTION_END.test(skill)) continue;
        output.push(skill);
        if (canonicalSkill(value)) break;
      }
    }
  }
  return output;
}

function explicitSkills(lines: string[]) {
  const skills: string[] = [];
  let block: string[] = [];
  let active = false;
  const flush = () => {
    skills.push(...declaredSkills(block.join('\n')));
    block = [];
  };
  for (const line of lines) {
    const heading = line.match(SKILL_HEADING);
    const inline = line.match(CORE_INLINE);
    if (heading || inline) {
      flush();
      active = true;
      const content = heading ? heading[1] : line.slice(inline!.index! + inline![0].length);
      const narrative = content.match(NARRATIVE);
      block.push(narrative ? content.slice(0, narrative.index) : content);
      if (narrative) { flush(); active = false; }
      continue;
    }
    // Within a declared skills list, "Languages: Python, C++" is a
    // programming category, not the start of a separate spoken-language sidebar.
    if (active && CATEGORY.test(line)) {
      block.push(line.replace(CATEGORY, ''));
      continue;
    }
    if (SECTION_END.test(line)) {
      flush();
      active = false;
    }
    if (!active) continue;
    const narrative = line.match(NARRATIVE);
    if (narrative) {
      block.push(line.slice(0, narrative.index));
      flush();
      active = false;
    } else block.push(line);
  }
  flush();
  return skills;
}

function bodySkills(lines: string[]) {
  let excluded = false;
  const body: string[] = [];
  for (const line of lines) {
    if (/^(?:contact|languages|certifications?|certificates?|education)\b/i.test(line)) excluded = true;
    else if (/^(?:summary|about|profile|(?:work\s+|professional\s+)?experience|projects?)\b|^\[Column break\]$/i.test(line)) excluded = false;
    if (!excluded && !/^(?:Page\s+\d+\s+of\s+\d+|.*@.*|https?:.*|www\..*)$/i.test(line)) body.push(line);
  }
  const text = body.join(' ').replace(/\s+/g, ' ');
  const matches: Array<{ skill: string; start: number; end: number }> = [];
  for (const [skill, aliases] of SKILL_ALIASES) {
    if (AMBIGUOUS_PROSE_SKILLS.has(skill)) continue;
    for (const alias of aliases) {
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}+#])(${aliasPattern(alias)})(?=$|[^\\p{L}\\p{N}+#])`, 'giu');
      for (const match of text.matchAll(pattern)) {
        // A lowercase "react" or "angular" in a sentence is not a framework.
        if ((skill === 'React' || skill === 'Angular') && alias === skill.toLowerCase() && match[2][0] !== skill[0]) continue;
        const start = match.index! + match[1].length;
        matches.push({ skill, start, end: start + match[2].length });
      }
    }
  }
  // Prefer the longer term at the same location: SQL Server is not a second SQL,
  // and Smart Contract Architecture is not truncated into Smart Contracts.
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  let end = -1;
  return matches.filter((match) => {
    if (match.start < end) return false;
    end = match.end;
    return true;
  }).map((match) => match.skill);
}

const NAME_STOP = /@|https?:|www\.|linkedin|github|\b(?:contact|resume|curriculum|vitae|summary|profile|objective|experience|education|skills|developer|engineer|engineering|scientist|software|management|development|contracts?|operations|services|solutions|manager|designer|analyst|lead|director|consultant|specialist|architect|architecture|technical|programming|applications?|systems?|cloud|security|blockchain|course|certificate|certification|university|college|bachelor|master|languages|page|professional|working)\b/i;

export function isLikelyPersonName(value: string, skills: string[] = []) {
  const name = clean(value);
  const words = name.split(' ');
  return name.length >= 3 && name.length <= 100 && words.length >= 2 && words.length <= 5 &&
    /^[\p{L}][\p{L}'’. -]+$/u.test(name) &&
    words.every((word, index) => (index > 0 && /^(?:de|del|da|van|von|bin|al|el)$/i.test(word)) || /^[\p{Lu}\p{Lt}]/u.test(word)) &&
    !NAME_STOP.test(name) && !canonicalSkill(name) &&
    !skills.some((skill) => clean(skill).toLowerCase() === name.toLowerCase());
}

function textName(lines: string[], skills: string[]) {
  for (const line of lines.slice(0, 40)) {
    const labeled = line.match(/^(?:full\s+name|name)\s*:\s*(.+)$/i);
    if (labeled && isLikelyPersonName(labeled[1], skills)) return clean(labeled[1]);
  }
  const mainHeading = lines.findIndex((line) => /^(?:summary|about|profile|(?:work\s+|professional\s+)?experience|education)\s*:?\s*$/i.test(line));
  const candidates = lines.slice(0, mainHeading < 0 ? 30 : mainHeading);
  let inSidebarSection = false;
  for (const line of candidates) {
    if (SKILL_HEADING.test(line) || /^(?:contact|languages|certifications?|certificates?)\b/i.test(line)) {
      inSidebarSection = true;
      continue;
    }
    if (SECTION_END.test(line)) inSidebarSection = false;
    if (!inSidebarSection && isLikelyPersonName(line, skills)) return clean(line);
  }
  return '';
}

export function parseResumeText(text: string, options: { nameHint?: string } = {}): ParsedResume {
  if (!text.trim()) throw new Error('Paste your profile or resume text first.');
  if (text.length > 100_000) throw new Error('Please limit the profile text to 100,000 characters.');
  const lines = text.replace(/\u00ad/g, '').replace(/-\s*\n\s*(?=\p{L})/gu, '-').split(/\r?\n/).map((line) => line.trim());
  const seen = new Set<string>();
  const skills = [...explicitSkills(lines), ...bodySkills(lines)].filter((skill) => {
    const key = skill.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const name = options.nameHint && isLikelyPersonName(options.nameHint, skills)
    ? clean(options.nameHint) : textName(lines, skills);
  return { name, skills, detectedSkillCount: skills.length };
}
