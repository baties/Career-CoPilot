import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillLevels = Record<string, SkillLevel>;

export const SKILL_LEVEL_OPTIONS: Array<{ value: SkillLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

interface SkillInputProps {
  skills: string[];
  levels: SkillLevels;
  onChange: (skills: string[], levels: SkillLevels) => void;
  maxSkills?: number;
  disabled?: boolean;
}

export function SkillInput({ skills, levels, onChange, maxSkills = 10, disabled }: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addSkill = (value: string) => {
    const trimmed = value.trim().replace(/,/g, '').slice(0, 50);
    if (!trimmed) return;
    if (skills.length >= maxSkills || skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...skills, trimmed], { ...levels, [trimmed]: 'beginner' });
    setInputValue('');
  };

  const removeSkill = (skill: string) => {
    const next = { ...levels };
    delete next[skill];
    onChange(skills.filter((s) => s !== skill), next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="skill-add" className="sr-only">Add a skill</label>
        <input
          id="skill-add"
          type="text"
          value={inputValue}
          disabled={disabled || skills.length >= maxSkills}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addSkill(inputValue)}
          maxLength={50}
          className="w-full px-5 py-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md text-foreground font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm disabled:opacity-60"
          placeholder={skills.length >= maxSkills ? `Maximum ${maxSkills} skills reached` : 'Type a skill and press Enter, e.g. React'}
          data-testid="input-skill"
        />
      </div>

      {skills.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            New and imported skills start at Beginner. Please review each level. Levels are your own self-assessment and do not affect job scoring.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {skills.map((skill) => (
              <li key={skill} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 pl-4 pr-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground" title={skill}>{skill}</span>
                <select
                  aria-label={`Self-assessed level for ${skill}`}
                  value={levels[skill] ?? 'beginner'}
                  disabled={disabled}
                  onChange={(e) => onChange(skills, { ...levels, [skill]: e.target.value as SkillLevel })}
                  className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  data-testid={`select-level-${skill}`}
                >
                  {SKILL_LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
