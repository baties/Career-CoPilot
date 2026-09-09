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
      className="flex flex-wrap items-center gap-2 p-2 min-h-[46px] w-full rounded-md border border-input bg-card shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((skill, index) => (
        <span 
          key={index}
          className="flex items-center gap-1 bg-secondary text-secondary-foreground text-sm px-2.5 py-1 rounded-full font-medium"
        >
          {skill}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeSkill(index);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            aria-label={`Remove ${skill}`}
          >
            <X size={14} />
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
          className="flex-1 bg-transparent min-w-[120px] outline-none text-sm placeholder:text-muted-foreground"
          placeholder={skills.length === 0 ? "e.g. React, TypeScript, Node.js..." : "Add another skill..."}
        />
      )}
    </div>
  );
}
