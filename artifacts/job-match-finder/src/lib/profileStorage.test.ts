import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyProfile, loadProfile, PROFILE_STORAGE_KEY, serializeProfile, type ProfileStorage } from './profileStorage';
import { mergeExtractedSkills } from './skillLibrary';

function memoryStorage(raw: string | null = null): ProfileStorage {
  const data = new Map<string, string>();
  if (raw !== null) data.set(PROFILE_STORAGE_KEY, raw);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
  };
}

test('a new browser starts with defaults without writing a profile', () => {
  const storage = memoryStorage();
  const loaded = loadProfile(storage);
  assert.deepEqual(loaded.profile, emptyProfile());
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.status.kind, 'ready');
  assert.equal(storage.getItem(PROFILE_STORAGE_KEY), null);
});

test('restores all profile fields, skill order/source, levels, and active choices exactly', () => {
  const profile = emptyProfile();
  profile.candidateName = 'Test Member';
  profile.formData = { title: 'Developer', location: 'Worldwide', education: 'masters', workType: 'hybrid' };
  profile.skillLibrary = mergeExtractedSkills([], Array.from({ length: 25 }, (_, i) => `Skill ${25 - i}`)).library;
  profile.skillLibrary[0].active = false;
  profile.skillLibrary[1].level = 'expert';
  profile.skillLibrary.push({ name: 'Custom Skill', level: 'advanced', source: 'manual', active: true });
  profile.worldwide = false;
  profile.selections = [
    { code: 'CA', country: 'Canada', cities: ['Toronto', 'Calgary'] },
    { code: 'AE', country: 'United Arab Emirates', cities: ['Dubai'] },
    { code: 'GB', country: 'United Kingdom', cities: [] },
  ];
  const storage = memoryStorage(serializeProfile(profile));
  assert.deepEqual(loadProfile(storage).profile, profile);
  assert.equal(loadProfile(storage).status.kind, 'saved');
  assert.equal(loadProfile(storage).blocked, false);
});

test('unfinished form fields and no active skills are valid saved drafts', () => {
  const profile = emptyProfile();
  profile.formData.title = 'D';
  profile.worldwide = false;
  profile.skillLibrary = [{ name: 'React', level: 'beginner', source: 'extracted', active: false }];
  assert.deepEqual(loadProfile(memoryStorage(serializeProfile(profile))).profile, profile);
});

test('never serializes raw resume content, LinkedIn URLs, provider responses or job results', () => {
  const raw = serializeProfile({
    ...emptyProfile(),
    pastedText: 'PRIVATE RAW TEXT',
    profileUrl: 'https://www.linkedin.com/in/test',
    consent: true,
    providerResponse: { full_name: 'RAW PERSON' },
    results: { jobs: ['RAW JOB'] },
  } as ReturnType<typeof emptyProfile>);
  for (const excluded of ['PRIVATE RAW TEXT', 'linkedin.com', 'consent', 'RAW PERSON', 'RAW JOB']) {
    assert.ok(!raw.includes(excluded));
  }
});

test('corrupt and unsupported saved data fail explicitly without overwriting the original', () => {
  for (const raw of ['{bad JSON', JSON.stringify({ version: 99, profile: emptyProfile() }), JSON.stringify({ version: 1, profile: {} })]) {
    const storage = memoryStorage(raw);
    const loaded = loadProfile(storage);
    assert.equal(loaded.status.kind, 'error');
    assert.equal(loaded.blocked, true);
    assert.equal(storage.getItem(PROFILE_STORAGE_KEY), raw);
  }
});

test('too many active skills or duplicates cannot be silently restored', () => {
  const skills = mergeExtractedSkills([], Array.from({ length: 25 }, (_, i) => `Skill ${i}`)).library;
  skills[20].active = true;
  const overCap = { ...emptyProfile(), skillLibrary: skills };
  assert.throws(() => serializeProfile(overCap));
  assert.equal(loadProfile(memoryStorage(JSON.stringify({ version: 1, profile: overCap }))).blocked, true);
  const duplicate = { ...emptyProfile(), skillLibrary: [skills[0], { ...skills[0], name: skills[0].name.toUpperCase() }] };
  assert.throws(() => serializeProfile(duplicate));
});

test('invalid level or extracted/manual source cannot be restored', () => {
  for (const skill of [
    { name: 'React', level: 'unknown', source: 'extracted', active: true },
    { name: 'React', level: 'expert', source: 'unknown', active: true },
  ]) {
    const storage = memoryStorage(JSON.stringify({ version: 1, profile: { ...emptyProfile(), skillLibrary: [skill] } }));
    assert.equal(loadProfile(storage).blocked, true);
  }
});

test('storage access failure is reported rather than crashing', () => {
  const storage = memoryStorage();
  storage.getItem = () => { throw new Error('Storage blocked'); };
  assert.equal(loadProfile(storage).status.kind, 'error');
  assert.equal(loadProfile(storage).blocked, true);
});

test('removing the saved profile restores empty defaults without regenerating old data', () => {
  const profile = { ...emptyProfile(), candidateName: 'Test Member' };
  const storage = memoryStorage(serializeProfile(profile));
  storage.removeItem(PROFILE_STORAGE_KEY);
  assert.deepEqual(loadProfile(storage).profile, emptyProfile());
  assert.equal(storage.getItem(PROFILE_STORAGE_KEY), null);
});