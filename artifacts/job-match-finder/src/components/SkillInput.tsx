import React, { useState, KeyboardEvent, useRef } from 'react';
import { X } from 'lucide-react';

interface SkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}

export function SkillInput({ skills, onChange, maxSkills = 10 }: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && skills.length > 0) {
      e.preventDefault();
      const newSkills = [...skills];
      newSkills.pop();
      onChange(newSkills);
    }
  };

  const addSkill = (value: string) => {
    const trimmed = value.trim().replace(/,/g, '');
    if (trimmed && skills.length < maxSkills && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInputValue('');
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addSkill(inputValue);
    }
  };

  const removeSkill = (indexToRemove: number) => {
    onChange(skills.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div 
      className="flex flex-wrap items-center gap-2.5 p-3 min-h-[60px] w-full rounded-xl border border-border/60 bg-background/60 backdrop-blur-md shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary cursor-text hover:border-primary/30"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((skill, index) => (
        <span 
          key={index}
          className="flex items-center gap-1.5 bg-foreground text-background text-sm px-3.5 py-1.5 rounded-lg font-bold shadow-sm"
        >
          {skill}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeSkill(index);
            }}
            className="text-background/70 hover:text-background transition-colors focus:outline-none"
            aria-label={`Remove ${skill}`}
          >
            <X size={14} strokeWidth={3} />
          </button>
        </span>
      ))}
      {skills.length < maxSkills && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 bg-transparent min-w-[150px] outline-none text-base font-medium text-foreground placeholder:text-muted-foreground/70"
          placeholder={skills.length === 0 ? "e.g. React, TypeScript, Node.js..." : "Add another skill..."}
        />
      )}
    </div>
  );
}
