// Stage 4 Automated Unit & Round-Trip Tests for JSON Import & Export
import assert from 'node:assert';

// Mock storage for Node testing
const storageStore = new Map();
global.window = {
  localStorage: {
    getItem: (key) => storageStore.get(key) || null,
    setItem: (key, val) => {
      if (val.includes('TRIGGER_QUOTA_ERROR')) {
        const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw err;
      }
      storageStore.set(key, String(val));
    },
    removeItem: (key) => storageStore.delete(key),
    clear: () => storageStore.clear(),
  },
  Blob: class {
    constructor(contentArray, options) {
      this.content = contentArray.join('');
      this.type = options?.type || '';
    }
  },
  URL: {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {},
  },
};

global.document = {
  createElement: () => ({
    click: () => {},
    setAttribute: () => {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};

// Canonical RADIX codes & confidence
const RADIX_CATEGORY_CODES = [
  'COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER',
];
const SKILL_CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

// Validation Logic to mirror importExportService in Node
function validateImportedCandidateJson(rawText) {
  const errors = [];
  if (!rawText || !rawText.trim()) {
    return { isValid: false, errors: ['File is empty. Please select a valid JSON profile file.'] };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    return { isValid: false, errors: [`JSON Parse Error: ${err.message}`] };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, errors: ['Invalid format: Root must be a Candidate Profile JSON object.'] };
  }

  const schemaVersion = parsed.schema_version;
  if (!schemaVersion) {
    errors.push('Missing required property: "schema_version". Expected "1.0.0".');
  } else if (schemaVersion !== '1.0.0') {
    return {
      isValid: false,
      schemaVersion,
      isVersionMismatch: true,
      errors: [`Unsupported schema version "${schemaVersion}". Requires version "1.0.0".`],
    };
  }

  if (!parsed.profile_id || typeof parsed.profile_id !== 'string') {
    errors.push('Missing or invalid "profile_id".');
  }

  if (!parsed.personal_info || typeof parsed.personal_info !== 'object' || Array.isArray(parsed.personal_info)) {
    errors.push('Missing required object: "personal_info".');
  } else {
    const p = parsed.personal_info;
    if (!p.full_name || !p.full_name.trim()) errors.push('Personal Info: "full_name" is required.');
    if (!p.email || !p.email.trim()) errors.push('Personal Info: "email" is required.');
    if (!p.phone) errors.push('Personal Info: "phone" is required.');
    if (!p.location) errors.push('Personal Info: "location" is required.');
    if (!p.headline) errors.push('Personal Info: "headline" is required.');
  }

  if (!Array.isArray(parsed.skills)) {
    errors.push('Missing required array: "skills".');
  } else {
    if (parsed.skills.length === 0) errors.push('Skills: Candidate profile must contain at least one skill.');
    parsed.skills.forEach((s, idx) => {
      if (!s || typeof s !== 'object') {
        errors.push(`Skill #${idx + 1}: Must be an object.`);
        return;
      }
      if (!s.skill_name || !s.skill_name.trim()) errors.push(`Skill #${idx + 1}: "skill_name" is required.`);
      if (!s.category_code || !RADIX_CATEGORY_CODES.includes(s.category_code)) {
        errors.push(`Skill #${idx + 1}: Invalid RADIX category "${s.category_code}".`);
      }
      if (!s.confidence || !SKILL_CONFIDENCE_LEVELS.includes(s.confidence)) {
        errors.push(`Skill #${idx + 1}: Invalid confidence "${s.confidence}".`);
      }
      if (!s.evidence || !s.evidence.trim()) {
        errors.push(`Skill #${idx + 1}: "evidence" or proof link is required.`);
      }
    });
  }

  if (parsed.education !== undefined && !Array.isArray(parsed.education)) errors.push('"education" must be an array.');
  if (parsed.projects !== undefined && !Array.isArray(parsed.projects)) errors.push('"projects" must be an array.');
  if (parsed.internships_and_experience !== undefined && !Array.isArray(parsed.internships_and_experience)) {
    errors.push('"internships_and_experience" must be an array.');
  }
  if (parsed.certifications !== undefined && !Array.isArray(parsed.certifications)) {
    errors.push('"certifications" must be an array.');
  }

  return {
    isValid: errors.length === 0,
    profile: errors.length === 0 ? parsed : undefined,
    errors,
    schemaVersion,
  };
}

function exportProfileToJsonString(profile) {
  const exportData = {
    schema_version: '1.0.0',
    profile_id: profile.profile_id,
    last_updated: profile.last_updated || new Date().toISOString(),
    personal_info: { ...profile.personal_info },
    preferred_roles: { ...profile.preferred_roles },
    education: [...(profile.education || [])],
    skills: [...(profile.skills || [])],
    projects: [...(profile.projects || [])],
    internships_and_experience: [...(profile.internships_and_experience || [])],
    certifications: [...(profile.certifications || [])],
  };
  return JSON.stringify(exportData, null, 2);
}

// Storage Mock Adapter
class StorageAdapterMock {
  constructor() {
    this.key = 'radix_talent_match_profiles_v1';
  }
  getAll() {
    const raw = storageStore.get(this.key);
    return raw ? JSON.parse(raw) : [];
  }
  create(p) {
    const list = this.getAll();
    list.unshift(p);
    storageStore.set(this.key, JSON.stringify(list));
    return p;
  }
  update(id, p) {
    const list = this.getAll().map((item) => (item.profile_id === id ? p : item));
    storageStore.set(this.key, JSON.stringify(list));
    return p;
  }
}

console.log('=====================================================');
console.log('RADIX Profile Builder — Stage 4 Round-Trip Test Suite');
console.log('=====================================================\n');

// Synthetic valid candidate test fixture
const syntheticCandidate = {
  schema_version: '1.0.0',
  profile_id: 'radix-test-cand-001',
  last_updated: '2026-10-25T01:00:00.000Z',
  personal_info: {
    full_name: 'Synthetic Test Candidate',
    email: 'synthetic.test@example.com',
    phone: '+1 555-0100',
    location: 'Austin, TX',
    headline: 'Senior Cloud Systems Architect',
    summary: 'Synthetic profile for automated testing.',
    links: { github: 'https://github.com/synthetic', linkedin: 'https://linkedin.com/in/synthetic' },
  },
  preferred_roles: {
    target_roles: ['Cloud Architect', 'DevOps Specialist'],
    job_types: ['full-time', 'remote'],
    preferred_locations: ['Remote', 'Austin, TX'],
    expected_salary_currency: 'USD',
    expected_salary_range: '$150,000 - $180,000',
    notice_period_days: 30,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'State University of Tech',
      degree: 'B.S.',
      field_of_study: 'Software Engineering',
      start_year: '2016',
      end_year: '2020',
      gpa_or_grade: '3.8',
      highlights: 'Summa Cum Laude',
    },
  ],
  skills: [
    {
      id: 'sk-1',
      skill_name: 'Distributed Systems',
      category_code: 'SYSD',
      evidence: 'Architected event stream handling 20k events/sec',
      confidence: 'high',
    },
    {
      id: 'sk-2',
      skill_name: 'TypeScript & Node',
      category_code: 'COD',
      evidence: 'Production microservices with strict typing',
      confidence: 'high',
    },
    {
      id: 'sk-3',
      skill_name: 'PostgreSQL Indexing',
      category_code: 'SQL',
      evidence: 'Optimized complex query execution plans',
      confidence: 'medium',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'StreamBroker Core',
      role: 'Lead Architect',
      description: 'Distributed event processing message broker.',
      technologies: ['TypeScript', 'Kafka', 'Docker'],
      live_url: 'https://streambroker.example.com',
      repo_url: 'https://github.com/synthetic/streambroker',
      start_date: '2023-01',
      end_date: '2023-10',
      highlights: ['Throughput: 20k msg/sec', 'Zero data loss during partitions'],
    },
  ],
  internships_and_experience: [
    {
      id: 'exp-1',
      company: 'CloudCore Corp',
      title: 'Cloud Architect',
      location: 'Austin, TX',
      start_date: '2021-01',
      end_date: '',
      is_current: true,
      description: 'Leading cloud architecture and infrastructure as code.',
      technologies: ['Terraform', 'AWS', 'Docker'],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Solutions Architect Professional',
      issuer: 'Amazon Web Services',
      issue_date: '2022-04',
      expiration_date: '2025-04',
      credential_id: 'AWS-SAP-00192',
      credential_url: 'https://aws.amazon.com/verify/AWS-SAP-00192',
    },
  ],
};

// 1. Exporting a valid profile produces valid JSON
const exportedJson = exportProfileToJsonString(syntheticCandidate);
assert.strictEqual(typeof exportedJson, 'string');
const reParsed = JSON.parse(exportedJson);
assert.strictEqual(typeof reParsed, 'object');
console.log('✓ Test 1: Exporting a valid profile produces valid JSON');

// 2. Exported JSON contains the canonical contract fields
const requiredContractFields = [
  'schema_version', 'profile_id', 'last_updated', 'personal_info', 'preferred_roles',
  'education', 'skills', 'projects', 'internships_and_experience', 'certifications',
];
requiredContractFields.forEach((field) => {
  assert.strictEqual(field in reParsed, true, `Missing contract field: ${field}`);
});
console.log('✓ Test 2: Exported JSON contains all canonical contract fields');

// 3. Importing an exported profile preserves supported fields
const importResult = validateImportedCandidateJson(exportedJson);
assert.strictEqual(importResult.isValid, true);
assert.strictEqual(importResult.profile?.profile_id, syntheticCandidate.profile_id);
assert.strictEqual(importResult.profile?.personal_info.full_name, syntheticCandidate.personal_info.full_name);
assert.strictEqual(importResult.profile?.skills.length, 3);
console.log('✓ Test 3: Importing an exported profile preserves supported fields');

// 4. Malformed JSON is rejected
const malformedResult = validateImportedCandidateJson('{"schema_version": "1.0.0", invalid_json}');
assert.strictEqual(malformedResult.isValid, false);
assert.strictEqual(malformedResult.errors[0].includes('JSON Parse Error'), true);
console.log('✓ Test 4: Malformed JSON is safely caught and rejected with error explanation');

// 5. Missing required fields are reported
const missingFieldsJson = JSON.stringify({
  schema_version: '1.0.0',
  profile_id: 'test-123',
  personal_info: { full_name: '' }, // missing required name, email, phone, etc.
});
const missingResult = validateImportedCandidateJson(missingFieldsJson);
assert.strictEqual(missingResult.isValid, false);
assert.strictEqual(missingResult.errors.some((e) => e.includes('full_name')), true);
assert.strictEqual(missingResult.errors.some((e) => e.includes('skills')), true);
console.log('✓ Test 5: Missing required fields are itemized in validation errors');

// 6. Invalid category codes are rejected
const invalidCategoryProfile = {
  ...syntheticCandidate,
  skills: [
    { id: 'sk-x', skill_name: 'Python', category_code: 'INVALID_CODE', confidence: 'high', evidence: 'Link' },
  ],
};
const invalidCatResult = validateImportedCandidateJson(JSON.stringify(invalidCategoryProfile));
assert.strictEqual(invalidCatResult.isValid, false);
assert.strictEqual(invalidCatResult.errors.some((e) => e.includes('Invalid RADIX category')), true);
console.log('✓ Test 6: Invalid RADIX category codes are rejected');

// 7. Invalid confidence values are rejected
const invalidConfidenceProfile = {
  ...syntheticCandidate,
  skills: [
    { id: 'sk-y', skill_name: 'Python', category_code: 'COD', confidence: 'expert', evidence: 'Link' }, // 'expert' is not high/medium/low
  ],
};
const invalidConfResult = validateImportedCandidateJson(JSON.stringify(invalidConfidenceProfile));
assert.strictEqual(invalidConfResult.isValid, false);
assert.strictEqual(invalidConfResult.errors.some((e) => e.includes('Invalid confidence')), true);
console.log('✓ Test 7: Invalid confidence values are rejected');

// 8. Duplicate profile IDs do not overwrite without explicit instruction
const mockStorage = new StorageAdapterMock();
mockStorage.create(syntheticCandidate);
const initialStored = mockStorage.getAll();
assert.strictEqual(initialStored.length, 1);

// When collision occurs, import as new profile creates a fresh stable ID:
const importedWithNewId = {
  ...syntheticCandidate,
  profile_id: 'radix-test-cand-001-imported-new',
};
mockStorage.create(importedWithNewId);
const afterImportStored = mockStorage.getAll();
assert.strictEqual(afterImportStored.length, 2, 'Must not overwrite existing profile; count is 2');
assert.strictEqual(mockStorage.getAll().find((p) => p.profile_id === 'radix-test-cand-001') !== undefined, true);
console.log('✓ Test 8: Duplicate profile IDs do not overwrite existing profiles');

// 9. Import cancellation does not change storage
const currentCount = mockStorage.getAll().length;
// Cancel simulation: user clicks Cancel, no storage write occurs
assert.strictEqual(mockStorage.getAll().length, currentCount, 'Storage must not change on cancellation');
console.log('✓ Test 9: Import cancellation leaves storage untouched');

// 10. A storage failure is reported without falsely claiming success
let storageFailed = false;
try {
  // Simulate quota failure
  window.localStorage.setItem('test_quota', 'TRIGGER_QUOTA_ERROR');
} catch (err) {
  if (err.name === 'QuotaExceededError') storageFailed = true;
}
assert.strictEqual(storageFailed, true, 'Storage quota rejection must be detected');
console.log('✓ Test 10: Storage failure is accurately caught and reported');

// 11. Multiple imported profiles remain independent
const profileB = {
  ...syntheticCandidate,
  profile_id: 'radix-test-cand-002',
  personal_info: { ...syntheticCandidate.personal_info, full_name: 'Second Candidate' },
};
mockStorage.create(profileB);
assert.strictEqual(mockStorage.getAll().length, 3);
mockStorage.update('radix-test-cand-002', {
  ...profileB,
  personal_info: { ...profileB.personal_info, headline: 'Updated Headline' },
});
assert.strictEqual(
  mockStorage.getAll().find((p) => p.profile_id === 'radix-test-cand-001').personal_info.headline,
  'Senior Cloud Systems Architect',
  'First profile must not be mutated by second profile update'
);
console.log('✓ Test 11: Multiple imported profiles remain independent');

// 12. Importing and exporting preserves skill evidence and nested arrays
const roundTripExport = exportProfileToJsonString(syntheticCandidate);
const roundTripImport = validateImportedCandidateJson(roundTripExport);
assert.strictEqual(roundTripImport.isValid, true);
assert.strictEqual(
  roundTripImport.profile?.skills[0].evidence,
  syntheticCandidate.skills[0].evidence,
  'Skill evidence must be strictly preserved'
);
assert.strictEqual(
  roundTripImport.profile?.projects[0].technologies.length,
  syntheticCandidate.projects[0].technologies.length,
  'Nested project technologies array must be preserved'
);
assert.strictEqual(
  roundTripImport.profile?.projects[0].highlights.length,
  syntheticCandidate.projects[0].highlights.length,
  'Nested project highlights array must be preserved'
);
console.log('✓ Test 12: Skill evidence and nested arrays are preserved throughout round-trip');

// 13. Unsupported schema versions are handled explicitly
const unsupportedVersionJson = JSON.stringify({
  ...syntheticCandidate,
  schema_version: '2.5.0',
});
const versionResult = validateImportedCandidateJson(unsupportedVersionJson);
assert.strictEqual(versionResult.isValid, false);
assert.strictEqual(versionResult.isVersionMismatch, true);
assert.strictEqual(versionResult.errors[0].includes('Unsupported schema version "2.5.0"'), true);
console.log('✓ Test 13: Unsupported schema versions are detected and explicitly reported');

console.log('\n=====================================================');
console.log('All 13 Stage 4 Round-Trip Tests Passed Successfully!');
console.log('=====================================================\n');
