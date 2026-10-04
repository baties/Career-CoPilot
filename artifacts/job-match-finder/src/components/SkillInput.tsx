import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import {
  MAX_ACTIVE_SKILLS,
  addManualSkill,
  removeManualSkill,
  setSkillActive,
  type CandidateSkill,
  type SkillLevel,
} from '../lib/skillLibrary';

export type { SkillLevel };

export const SKILL_LEVEL_OPTIONS: Array<{ value: SkillLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

interface SkillInputProps {
  skills: CandidateSkill[];
  onChange: (skills: CandidateSkill[]) => void;
  disabled?: boolean;
}

type Tab = 'active' | 'extracted' | 'added';

export function SkillInput({ skills, onChange, disabled }: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [tab, setTab] = useState<Tab>('active');
  const [feedback, setFeedback] = useState<{ kind: 'info' | 'warn'; text: string } | null>(null);

  const activeCount = skills.filter((s) => s.active).length;
  const extractedCount = skills.filter((s) => s.source === 'extracted').length;
  const addedCount = skills.filter((s) => s.source === 'manual').length;
  const atCap = activeCount >= MAX_ACTIVE_SKILLS;

  const visible = skills.filter((s) =>
    tab === 'active' ? s.active : tab === 'extracted' ? s.source === 'extracted' : s.source === 'manual',
  );

  const addSkill = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = addManualSkill(skills, trimmed);
    if (next === skills) {
      setFeedback({ kind: 'warn', text: `"${trimmed}" is already in your skills (names are not case sensitive).` });
      return;
    }
    const added = next[next.length - 1];
    onChange(next);
    setInputValue('');
    setFeedback(
      added.active
        ? { kind: 'info', text: `Added ${added.name} and marked it active.` }
        : {
            kind: 'warn',
            text: `Added ${added.name} as inactive because ${MAX_ACTIVE_SKILLS} skills are already active. Find it under Added skills and activate it after deselecting another.`,
          },
    );
  };

  const toggle = (skill: CandidateSkill, checked: boolean) => {
    const next = setSkillActive(skills, skill.name, checked);
    if (next === skills && checked) {
      setFeedback({ kind: 'warn', text: `${MAX_ACTIVE_SKILLS} skills are active. Deselect one first to activate ${skill.name}.` });
      return;
    }
    setFeedback(null);
    onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const tabClass = (t: Tab) =>
    `px-3 py-2 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
      tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background/60 border border-border/60 text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="skill-add" className="sr-only">Add a skill</label>
        <input
          id="skill-add"
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={50}
          className="w-full px-5 py-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md text-foreground font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm disabled:opacity-60"
          placeholder="Type a skill and press Enter, e.g. React"
          data-testid="input-skill"
        />
        <button
          type="button"
          disabled={disabled || !inputValue.trim()}
          onClick={() => addSkill(inputValue)}
          className="shrink-0 px-5 rounded-xl bg-foreground text-background font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          data-testid="button-add-skill"
        >
          Add
        </button>
      </div>

      {feedback && (
        <p
          role="status"
          data-testid="skill-feedback"
          className={`text-sm font-medium ${feedback.kind === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
        >
          {feedback.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Skill views">
        <button type="button" aria-pressed={tab === 'active'} onClick={() => setTab('active')} className={tabClass('active')} data-testid="tab-active-skills">
          Active skills ({activeCount}/{MAX_ACTIVE_SKILLS})
        </button>
        <button type="button" aria-pressed={tab === 'extracted'} onClick={() => setTab('extracted')} className={tabClass('extracted')} data-testid="tab-extracted-skills">
          All extracted skills ({extractedCount})
        </button>
        <button type="button" aria-pressed={tab === 'added'} onClick={() => setTab('added')} className={tabClass('added')} data-testid="tab-added-skills">
          Added skills ({addedCount})
        </button>
      </div>

      <p className="text-xs text-muted-foreground" data-testid="text-skill-counts">
        {activeCount}/{MAX_ACTIVE_SKILLS} active, {extractedCount} extracted.
        {atCap && ` ${MAX_ACTIVE_SKILLS} skills are active: deselect one before activating another.`}
      </p>

      <p className="text-xs text-muted-foreground">
        Skills keep their supplied or provider-returned order. The first {MAX_ACTIVE_SKILLS} are active by default when first imported. Only checked (active) skills are used in job search. New and imported skills start at Beginner; levels are your own self-assessment and do not affect job scoring. Extracted skills can be deactivated but not deleted.
      </p>

      <ul
        data-testid="skill-list"
        tabIndex={0}
        aria-label={tab === 'active' ? 'Active skills' : tab === 'extracted' ? 'All extracted skills' : 'Added skills'}
        className="max-h-80 overflow-y-auto overscroll-contain grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl"
      >
        {visible.length === 0 && (
          <li className="sm:col-span-2 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            {tab === 'active' ? 'No active skills. Check skills in the other views to include them in search.' : tab === 'extracted' ? 'No extracted skills yet. Upload a resume to import some.' : 'No skills added manually yet.'}
          </li>
        )}
        {visible.map((skill) => (
          <li
            key={skill.name}
            data-testid="skill-row"
            data-skill-name={skill.name}
            className={`flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 pl-3 pr-2 py-2 ${skill.active ? '' : 'opacity-75'}`}
          >
            <input
              type="checkbox"
              checked={skill.active}
              disabled={disabled}
              onChange={(e) => toggle(skill, e.target.checked)}
              aria-label={`Active skill: ${skill.name}`}
              className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
              data-testid={`checkbox-skill-${skill.name}`}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground" title={skill.name}>
              {skill.name}
              {!skill.active && <span className="ml-1.5 text-xs font-medium text-muted-foreground">inactive</span>}
            </span>
            <select
              aria-label={`Self-assessed level for ${skill.name}`}
              value={skill.level}
              disabled={disabled}
              onChange={(e) =>
                onChange(skills.map((s) => (s.name === skill.name ? { ...s, level: e.target.value as SkillLevel } : s)))
              }
              className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid={`select-level-${skill.name}`}
            >
              {SKILL_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {skill.source === 'manual' && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(removeManualSkill(skills, skill.name))}
                aria-label={`Remove ${skill.name}`}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <X size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
