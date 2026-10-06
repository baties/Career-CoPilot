import assert from 'node:assert/strict';
import test from 'node:test';
import { parseResumeText, isLikelyPersonName } from './resumeText';
import { pdfPageText, prominentPdfName, reconstructPdfLines, type PdfTextLine } from './pdfTextLayout';

test('a LinkedIn sidebar skill must not become the candidate name', () => {
  const text = 'Contact\nTop Skills\nSolidity\nSmart Contracts\nBlockchain Security\nLanguages\nEnglish (Professional Working)\nCertifications\nJava Course\n[Column break]\nAvery Morgan\nSmart Contract Technical Lead\nSummary\nCore areas: Solidity, EVM, Hardhat, OpenZeppelin';
  const parsed = parseResumeText(text, { nameHint: 'Avery Morgan' });
  assert.equal(parsed.name, 'Avery Morgan');
  assert.deepEqual(parsed.skills.slice(0, 3), ['Solidity', 'Smart Contracts', 'Blockchain Security']);
  assert.ok(parsed.skills.includes('Solidity'));
  assert.ok(!parsed.skills.includes('Java'));
  assert.ok(!parsed.skills.some((skill) => /English|Course|Avery/.test(skill)));
});

test('missing or uncertain names remain empty instead of guessing a skill or course title', () => {
  const parsed = parseResumeText('Top Skills\nCustom Strategic Planning\nSmart Contracts\nLanguages\nEnglish\nCertifications\nAdvanced Business Practice\nSummary\nReact');
  assert.equal(parsed.name, '');
  assert.equal(isLikelyPersonName('Smart Contracts'), false);
  assert.equal(isLikelyPersonName('Data Scientist'), false);
  assert.equal(isLikelyPersonName('Solidity Developer'), false);
});

test('labelled and international names work without consuming skill phrases', () => {
  assert.equal(parseResumeText('Name: Élodie van Dijk\nSkills: Python, SQL').name, 'Élodie van Dijk');
  assert.equal(parseResumeText("JANE O’NEILL\nSkills: Docker").name, 'JANE O’NEILL');
});

test('core-area bullets and wrapped skill names are complete and stop before narrative', () => {
  const parsed = parseResumeText('Avery Morgan\nSummary\nExperience.Core areas:• Solidity, EVM, Smart Contract\nArchitecture• DeFi, DApps, ERC-20 / ERC-721 / ERC-1155• Hardhat,\nOpenZeppelin, Tenderly, Etherscan• Python, Django, TypeScript, Node.js•\nBlockchain Backend Integration• Technical Leadership, Architecture,\nCode Review, Team GuidanceI remain hands-on with development\nwhile supporting the team.');
  assert.deepEqual(parsed.skills.slice(0, 20), [
    'Solidity', 'EVM', 'Smart Contract Architecture', 'DeFi', 'DApps', 'ERC-20',
    'ERC-721', 'ERC-1155', 'Hardhat', 'OpenZeppelin', 'Tenderly', 'Etherscan',
    'Python', 'Django', 'TypeScript', 'Node.js', 'Blockchain Backend Integration',
    'Technical Leadership', 'Architecture', 'Code Review',
  ]);
  assert.ok(parsed.skills.includes('Team Guidance'));
  assert.ok(!parsed.skills.some((skill) => /remain|supporting/.test(skill)));
});

test('unknown explicitly listed skills survive, with no ten- or twenty-skill truncation', () => {
  const names = Array.from({ length: 30 }, (_, i) => `Custom Competency ${i}`);
  assert.deepEqual(parseResumeText(`Avery Morgan\nSkills & Endorsements:\n${names.join('\n')}`).skills, names);
});

test('categories, bullets and slash lists are split without damaging CI/CD or C++', () => {
  assert.deepEqual(parseResumeText('Skills:\nFrameworks: React / Vue.js\nTools: CI/CD, C++, C#, Git\nDatabases: SQL Server').skills,
    ['React', 'Vue.js', 'CI/CD', 'C++', 'C#', 'Git', 'Microsoft SQL Server']);
});

test('programming-language categories within skills do not discard following skills', () => {
  assert.deepEqual(parseResumeText('Skills:\nLanguages: Python, C++\nFrameworks: React, Django\nExperience\nDeveloper').skills.slice(0, 4),
    ['Python', 'C++', 'React', 'Django']);
});

test('single-line core lists retain the final skill before a narrative sentence', () => {
  assert.deepEqual(parseResumeText('Avery Morgan\nSummary\nCore areas: Solidity, Hardhat, Team GuidanceI remain hands-on.').skills.slice(0, 3),
    ['Solidity', 'Hardhat', 'Team Guidance']);
});

test('languages, certifications, education and dates do not become skills', () => {
  const parsed = parseResumeText('Avery Morgan\nTop Skills\nSolidity\nLanguages\nFrench (Limited Working)\nCertifications\nCertificate of Completion: Java Course\nProgramming Android Applications\nSummary\nUsing Python and Django.\nEducation\nBachelor of Chemistry\nCourse: Java');
  assert.deepEqual(parsed.skills, ['Solidity', 'Python', 'Django']);
});

test('ordinary verbs and generic prose are not treated as React, Go or soft skills', () => {
  const parsed = parseResumeText('Avery Morgan\nSummary\nI react quickly, go to meetings, excel at writing and research marketing. We use Docker, React and Python.');
  assert.deepEqual(parsed.skills, ['Docker', 'React', 'Python']);
});

test('longer tool names win over overlapping short matches; match order stays intact', () => {
  assert.deepEqual(parseResumeText('Avery Morgan\nSummary\nUsing Microsoft SQL Server, Django REST Framework, Docker and SQL.').skills,
    ['Microsoft SQL Server', 'Django REST Framework', 'Docker', 'SQL']);
});

test('PDF fragments are joined within words but not across a column gap', () => {
  const fragment = (str: string, x: number, y: number, width: number, hasEOL = false) =>
    ({ str, transform: [12, 0, 0, 12, x, y], width, height: 12, hasEOL });
  const lines = reconstructPdfLines([
    fragment('Smart ', 20, 700, 36), fragment('Contracts', 56, 700, 50, true),
    fragment('Node', 20, 680, 24), fragment('.js', 44, 680, 14, true),
    fragment('Top Skills', 20, 740, 60), fragment('Avery Morgan', 212, 740, 100, true),
    fragment('Page 1 of 4', 300, 20, 80, true),
  ]);
  assert.deepEqual(lines.map((line) => line.text), ['Smart Contracts', 'Node.js', 'Top Skills', 'Avery Morgan']);
});

test('PDF name selection prefers a prominent header to sidebar skills and role titles', () => {
  const lines: PdfTextLine[] = [
    { text: 'Smart Contracts', x: 20, y: 650, fontSize: 11 },
    { text: 'Avery Morgan', x: 212, y: 740, fontSize: 26 },
    { text: 'Senior Solidity Engineer', x: 212, y: 715, fontSize: 12 },
    { text: 'Python and Docker', x: 212, y: 450, fontSize: 11 },
  ];
  assert.equal(prominentPdfName(lines), 'Avery Morgan');
  assert.equal(prominentPdfName(lines.filter((line) => line.text !== 'Avery Morgan')), undefined);
  assert.ok(pdfPageText(lines).includes('[Column break]'));
});
