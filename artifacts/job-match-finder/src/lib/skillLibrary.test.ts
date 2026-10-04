import assert from 'node:assert/strict';
import test from 'node:test';
import { addManualSkill, mergeExtractedSkills, removeManualSkill, setSkillActive } from './skillLibrary';
import { parseResumeText } from './resumeParser';

const names = Array.from({ length: 25 }, (_, index) => `Skill ${index + 1}`);

test('retains every extracted skill in source order, with first 20 active', () => {
  const result = mergeExtractedSkills([], names);
  assert.deepEqual(result.library.map((skill) => skill.name), names);
  assert.equal(result.library.length, 25);
  assert.deepEqual(result.library.filter((s) => s.active).map((s) => s.name), names.slice(0, 20));
  assert.equal(result.inactive, 5);
  assert.equal(result.activated, 20);
});

test('cannot delete extracted skills; can deselect and reactivate without changing order', () => {
  const library = mergeExtractedSkills([], names).library;
  assert.deepEqual(removeManualSkill(library, names[0]), library);
  assert.equal(setSkillActive(library, names[20], true), library);
  const deactivated = setSkillActive(library, names[0], false);
  const activated = setSkillActive(deactivated, names[20], true);
  assert.equal(activated.filter((s) => s.active).length, 20);
  assert.deepEqual(activated.map((s) => s.name), names);
  assert.ok(!activated[0].active && activated[20].active);
});

test('manual additions at the cap remain available but inactive and deletable', () => {
  const library = mergeExtractedSkills([], names).library;
  const added = addManualSkill(library, 'Custom Skill');
  assert.equal(added.length, 26);
  assert.deepEqual(added[25], { name: 'Custom Skill', source: 'manual', level: 'beginner', active: false });
  assert.equal(addManualSkill(added, 'custom skill'), added);
  assert.deepEqual(removeManualSkill(added, 'Custom Skill'), library);
  assert.equal(setSkillActive(setSkillActive(added, names[0], false), 'Custom Skill', true).filter((s) => s.active).length, 20);
});

test('later imports preserve edits, inactive selections, and earlier extracted entries', () => {
  const library = mergeExtractedSkills([], names).library;
  library[0].level = 'expert';
  library[0].active = false;
  const result = mergeExtractedSkills(library, ['Skill 2', 'skill 1', 'New Imported Skill']);
  assert.equal(result.library[1].level, 'expert');
  assert.equal(result.library[1].active, false);
  assert.equal(result.library[2].active, true);
  assert.equal(result.library.length, 26);
  assert.equal(result.duplicates, 2);
  assert.equal(result.library.filter((s) => s.active).length, 20);
});

test('manual skills that appear in an import become protected extracted skills', () => {
  const manual = addManualSkill([], 'React');
  manual[0].level = 'expert';
  const result = mergeExtractedSkills(manual, ['react', 'React', 'SQL']);
  assert.equal(result.library.length, 2);
  assert.equal(result.library[0].source, 'extracted');
  assert.equal(result.library[0].level, 'expert');
  assert.deepEqual(removeManualSkill(result.library, 'React'), result.library);
});

test('text extraction retains more than 20 skills, without alphabetizing the supplied list', () => {
  const reversed = [...names].reverse();
  const result = parseResumeText(`Test Member\nSkills: ${reversed.join(', ')}`);
  assert.deepEqual(result.skills, reversed);
  assert.equal(result.detectedSkillCount, 25);
});

test('recognized skills outside a named section follow occurrence order', () => {
  assert.deepEqual(parseResumeText('Test Member\nI work with Docker, React and Python.').skills, ['Docker', 'React', 'Python']);
});