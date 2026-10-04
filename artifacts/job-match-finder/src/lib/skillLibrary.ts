export const MAX_ACTIVE_SKILLS = 20;
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export interface CandidateSkill {
  name: string;
  level: SkillLevel;
  source: 'extracted' | 'manual';
  active: boolean;
}

const keyOf = (name: string) => name.trim().toLowerCase();
const clean = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, 50);

export function mergeExtractedSkills(current: CandidateSkill[], names: string[]) {
  const existing = new Map(current.map((skill) => [keyOf(skill.name), skill]));
  const seen = new Set<string>();
  const imported: CandidateSkill[] = [];
  let activeCount = current.filter((skill) => skill.active).length;
  let added = 0;
  let duplicates = 0;
  let activated = 0;
  for (const raw of names) {
    const name = clean(raw);
    const key = keyOf(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const prior = existing.get(key);
    if (prior) {
      duplicates++;
      // A skill found in an import becomes extracted and cannot subsequently be deleted.
      imported.push({ ...prior, source: 'extracted' });
    } else {
      const active = activeCount < MAX_ACTIVE_SKILLS;
      if (active) { activeCount++; activated++; }
      added++;
      imported.push({ name, source: 'extracted', active, level: 'beginner' });
    }
  }
  // Keep the supplied profile order. Preserve earlier skills and manual entries after it.
  const remaining = current.filter((skill) => !seen.has(keyOf(skill.name)));
  return {
    library: [...imported, ...remaining.filter((s) => s.source === 'extracted'), ...remaining.filter((s) => s.source === 'manual')],
    added, duplicates, activated,
    inactive: imported.filter((skill) => !skill.active).length,
  };
}

export function addManualSkill(current: CandidateSkill[], raw: string): CandidateSkill[] {
  const name = clean(raw.replace(/,/g, ''));
  if (!name || current.some((skill) => keyOf(skill.name) === keyOf(name))) return current;
  return [...current, {
    name, source: 'manual', level: 'beginner',
    active: current.filter((skill) => skill.active).length < MAX_ACTIVE_SKILLS,
  }];
}

export function setSkillActive(current: CandidateSkill[], name: string, active: boolean): CandidateSkill[] {
  const target = current.find((skill) => skill.name === name);
  if (!target || target.active === active) return current;
  if (active && current.filter((skill) => skill.active).length >= MAX_ACTIVE_SKILLS) return current;
  return current.map((skill) => skill.name === name ? { ...skill, active } : skill);
}

export function removeManualSkill(current: CandidateSkill[], name: string): CandidateSkill[] {
  return current.filter((skill) => skill.name !== name || skill.source !== 'manual');
}