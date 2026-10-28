import fs from 'node:fs';
import assert from 'node:assert';

// 1. Load disk fixture
const diskRaw = fs.readFileSync('test_fixtures/ananya_rao_parsed.json', 'utf-8');
const diskJson = JSON.parse(diskRaw);

// 2. Extract step 607 payload from transcript
const lines = fs.readFileSync(
  'C:/Users/surya/.gemini/antigravity-ide/brain/df5315f6-8199-4ef1-929c-3acab1bcc5df/.system_generated/logs/transcript_full.jsonl',
  'utf-8'
).split('\n');

let step607Json = null;
for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('Ananya Rao')) {
    const startIdx = obj.content.indexOf('{\r\n  "full_name": "Ananya Rao"') !== -1
      ? obj.content.indexOf('{\r\n  "full_name": "Ananya Rao"')
      : obj.content.indexOf('{\n  "full_name": "Ananya Rao"');
    if (startIdx === -1) continue;
    const endIdx = obj.content.lastIndexOf('}');
    const slice = obj.content.substring(startIdx, endIdx + 1);
    step607Json = JSON.parse(slice);
    console.log('Found Ananya JSON in step:', obj.step_index);
    break;
  }
}

assert(step607Json, 'Step 607 JSON must be found');

// 3. Deep compare
try {
  assert.deepStrictEqual(diskJson, step607Json);
  console.log('✓ Disk fixture test_fixtures/ananya_rao_parsed.json matches Step 607 PDF-derived payload 100%!');
} catch (e) {
  console.error('Mismatch found between disk and Step 607:', e.message);
  process.exit(1);
}

// 3b. Verify against resumeAdapter.ts exported constant
const adapterTs = fs.readFileSync('src/features/profile-builder/services/resumeAdapter.ts', 'utf-8');
const tsStart = adapterTs.indexOf('export const ANANYA_RAO_PARSED_RESUME: ParsedResumeInput = {');
assert(tsStart !== -1, 'ANANYA_RAO_PARSED_RESUME must be defined in resumeAdapter.ts');
console.log('✓ ANANYA_RAO_PARSED_RESUME is defined in resumeAdapter.ts');

// 4. Verify canonical categories
const RADIX_CATEGORY_CODES = [
  'COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER',
];

console.log('\n--- Verifying Ananya Skills and Canonical Category Codes ---');
for (const skill of diskJson.skills) {
  const isCanonical = RADIX_CATEGORY_CODES.includes(skill.categoryHint);
  console.log(`- ${skill.name}: categoryHint=${skill.categoryHint} (Canonical: ${isCanonical})`);
  assert.strictEqual(isCanonical, true, `Skill ${skill.name} must use a canonical RadixCategoryCode`);
}

// 5. Verify projects
console.log('\n--- Verifying Ananya Projects ---');
for (const proj of diskJson.projects) {
  console.log(`- ${proj.title} (Role: ${proj.role}, Tech: ${proj.technologies.join(', ')})`);
}
assert.strictEqual(diskJson.projects[0].title, 'Distributed URL-Shortening Service');
assert.strictEqual(diskJson.projects[1].title, 'Multithreaded Job Scheduler');
assert.strictEqual(diskJson.projects[2].title, 'Parking-Lot Management System');

// 6. Verify missing fields
console.log('\n--- Verifying Missing Information (Must remain blank/empty) ---');
console.log('Email:', diskJson.email ?? '<absent>');
console.log('Phone:', diskJson.phone ?? '<absent>');
console.log('Location:', diskJson.location ?? '<absent>');
console.log('Links:', diskJson.links ?? '<absent>');
console.log('Institution:', diskJson.education[0].institution === '' ? '<empty string>' : diskJson.education[0].institution);
console.log('Start year:', diskJson.education[0].start_year === '' ? '<empty string>' : diskJson.education[0].start_year);
console.log('Certifications:', diskJson.certifications.length === 0 ? '<empty array>' : diskJson.certifications);

assert.strictEqual(diskJson.email, undefined);
assert.strictEqual(diskJson.phone, undefined);
assert.strictEqual(diskJson.location, undefined);
assert.strictEqual(diskJson.links, undefined);
assert.strictEqual(diskJson.education[0].institution, '');
assert.strictEqual(diskJson.education[0].start_year, '');
assert.deepStrictEqual(diskJson.certifications, []);
console.log('\n✓ All checks passed successfully!');
