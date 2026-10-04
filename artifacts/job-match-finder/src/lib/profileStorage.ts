import { z } from 'zod';
import { MAX_ACTIVE_SKILLS } from './skillLibrary';
import { MAX_CITIES, MAX_COUNTRIES } from './locationData';

export const PROFILE_STORAGE_KEY = 'career-copilot.profile';

const skillSchema = z.object({
  name: z.string().trim().min(1).max(50),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  source: z.enum(['extracted', 'manual']),
  active: z.boolean(),
});

export const savedProfileSchema = z.object({
  candidateName: z.string().max(100),
  formData: z.object({
    // Empty/unfinished fields must survive refresh too.
    title: z.string().max(100),
    location: z.string().max(100),
    education: z.enum(['high-school', 'diploma', 'bachelors', 'masters', 'doctorate']),
    workType: z.enum(['remote', 'hybrid', 'onsite', 'any']),
  }),
  skillLibrary: z.array(skillSchema).superRefine((skills, ctx) => {
    if (skills.filter((skill) => skill.active).length > MAX_ACTIVE_SKILLS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Too many active skills' });
    }
    const names = skills.map((skill) => skill.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate skills' });
    }
  }),
  worldwide: z.boolean(),
  selections: z.array(z.object({
    code: z.string().regex(/^[A-Z]{2}$/),
    country: z.string().min(2).max(100),
    cities: z.array(z.string().min(2).max(100)).max(MAX_CITIES),
  })).max(MAX_COUNTRIES),
});

export type SavedProfile = z.infer<typeof savedProfileSchema>;
const envelopeSchema = z.object({ version: z.literal(1), profile: savedProfileSchema });
export type ProfileStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface StorageStatus {
  kind: 'ready' | 'saved' | 'error';
  message: string;
}

export function emptyProfile(): SavedProfile {
  return {
    candidateName: '',
    formData: { title: '', location: 'Worldwide', education: 'bachelors', workType: 'any' },
    skillLibrary: [],
    worldwide: true,
    selections: [],
  };
}

export function serializeProfile(profile: SavedProfile) {
  // Pick only the declared profile fields. Never persist raw PDFs, pasted text,
  // provider responses, URLs, lookup consent, or job results.
  return JSON.stringify({ version: 1, profile: savedProfileSchema.parse(profile) });
}

export function loadProfile(storage: ProfileStorage): {
  profile: SavedProfile;
  status: StorageStatus;
  blocked: boolean;
} {
  try {
    const raw = storage.getItem(PROFILE_STORAGE_KEY);
    if (raw === null) {
      return { profile: emptyProfile(), status: { kind: 'ready', message: 'Your profile will save automatically as you make changes.' }, blocked: false };
    }
    const parsed = envelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error('Invalid saved profile');
    return { profile: parsed.data.profile, status: { kind: 'saved', message: 'Saved profile restored on this device.' }, blocked: false };
  } catch {
    return {
      profile: emptyProfile(),
      status: { kind: 'error', message: 'Your saved profile could not be read. It has not been overwritten, and new changes cannot be saved yet. Reload to retry, or use Clear saved profile to start fresh.' },
      blocked: true,
    };
  }
}