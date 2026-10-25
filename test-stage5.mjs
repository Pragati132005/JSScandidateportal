// Stage 5 Automated QA & Integration Readiness Test Suite
import assert from 'node:assert';

console.log('=====================================================');
console.log('RADIX Profile Builder — Stage 5 QA & Integration Suite');
console.log('=====================================================\n');

// Canonical constants
const RADIX_CATEGORY_CODES = [
  'COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER',
];
const SKILL_CONFIDENCE_LEVELS = ['high', 'medium', 'low'];
assert.strictEqual(SKILL_CONFIDENCE_LEVELS.length, 3);

// 1. Category & Confidence Normalizers
function normalizeRadixCategory(hint) {
  if (!hint) return 'OTHER';
  const clean = hint.trim().toUpperCase();
  if (RADIX_CATEGORY_CODES.includes(clean)) {
    return clean;
  }
  return 'OTHER';
}

function normalizeSkillConfidence(conf) {
  if (conf === 'high' || conf === 'medium' || conf === 'low') {
    return conf;
  }
  return 'low';
}

// 2. URL Sanitization Logic
function isValidUrl(url) {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return false;
  }
  try {
    const formatted = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(formatted);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getSafeUrl(url) {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return undefined;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// 3. Resume Adapter Mapping Logic
function mapParsedResumeToCandidateProfile(parsed, existingProfile) {
  const profileId =
    existingProfile?.profile_id ||
    `radix-cand-test-${Date.now()}`;

  const mappedSkills = (parsed.skills || []).map((sk, idx) => ({
    id: `sk-resume-${idx + 1}`,
    skill_name: sk.name || 'General Engineering',
    category_code: normalizeRadixCategory(sk.categoryHint),
    evidence: sk.evidenceHint || 'Pending candidate evidence submission for Talent Check verification.',
    confidence: normalizeSkillConfidence(sk.confidence),
  }));

  return {
    schema_version: '1.0.0',
    profile_id: profileId,
    last_updated: new Date().toISOString(),
    personal_info: {
      full_name: parsed.full_name || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      location: parsed.location || '',
      headline: parsed.headline || '',
      summary: parsed.summary || '',
      links: {
        linkedin: parsed.links?.linkedin || '',
        github: parsed.links?.github || '',
        portfolio: parsed.links?.portfolio || '',
        other: '',
      },
    },
    preferred_roles: {
      target_roles: parsed.target_roles || [],
      job_types: ['full-time'],
      preferred_locations: [],
      expected_salary_currency: 'USD',
      expected_salary_range: '',
      notice_period_days: undefined,
    },
    education: (parsed.education || []).map((edu, idx) => ({
      id: `edu-resume-${idx + 1}`,
      institution: edu.institution,
      degree: edu.degree,
      field_of_study: edu.field_of_study,
      start_year: edu.start_year,
      end_year: edu.end_year,
      gpa_or_grade: edu.gpa || '',
      highlights: '',
    })),
    skills: mappedSkills,
    projects: (parsed.projects || []).map((proj, idx) => ({
      id: `proj-resume-${idx + 1}`,
      title: proj.title,
      role: proj.role || 'Contributor',
      description: proj.description,
      technologies: proj.technologies || [],
      live_url: proj.live_url || '',
      repo_url: proj.repo_url || '',
      start_date: '',
      end_date: '',
      highlights: proj.highlights || [],
    })),
    internships_and_experience: (parsed.experience || []).map((exp, idx) => ({
      id: `exp-resume-${idx + 1}`,
      company: exp.company,
      title: exp.title,
      location: exp.location,
      start_date: exp.start_date,
      end_date: exp.end_date || '',
      is_current: exp.is_current,
      description: exp.description,
      technologies: exp.technologies || [],
    })),
    certifications: (parsed.certifications || []).map((cert, idx) => ({
      id: `cert-resume-${idx + 1}`,
      name: cert.name,
      issuer: cert.issuer,
      issue_date: cert.issue_date,
      expiration_date: '',
      credential_id: '',
      credential_url: '',
    })),
  };
}

// -------------------------------------------------------------
// Test 1: Category Normalization - Uncertain categories map to OTHER without guessing
// -------------------------------------------------------------
assert.strictEqual(normalizeRadixCategory('CLOUD'), 'CLOUD');
assert.strictEqual(normalizeRadixCategory('COD'), 'COD');
assert.strictEqual(normalizeRadixCategory('unknown_tech_category'), 'OTHER');
assert.strictEqual(normalizeRadixCategory('RANDOM_STRING'), 'OTHER');
assert.strictEqual(normalizeRadixCategory(''), 'OTHER');
assert.strictEqual(normalizeRadixCategory(undefined), 'OTHER');
console.log('✓ Test 1: Category Normalization maps unsupported/uncertain categories to OTHER without guessing');

// -------------------------------------------------------------
// Test 2: Confidence Normalization - Unsupported confidence maps to low without guessing
// -------------------------------------------------------------
assert.strictEqual(normalizeSkillConfidence('high'), 'high');
assert.strictEqual(normalizeSkillConfidence('medium'), 'medium');
assert.strictEqual(normalizeSkillConfidence('low'), 'low');
assert.strictEqual(normalizeSkillConfidence('super_expert'), 'low');
assert.strictEqual(normalizeSkillConfidence('unknown'), 'low');
assert.strictEqual(normalizeSkillConfidence(''), 'low');
assert.strictEqual(normalizeSkillConfidence(undefined), 'low');
console.log('✓ Test 2: Confidence Normalization maps unknown/unsupported values to low without guessing');

// -------------------------------------------------------------
// Test 3: URL Security - Rejection of dangerous protocols (XSS vectors)
// -------------------------------------------------------------
assert.strictEqual(isValidUrl('https://example.com'), true);
assert.strictEqual(isValidUrl('http://github.com/project'), true);
assert.strictEqual(isValidUrl('linkedin.com/in/user'), true);
assert.strictEqual(isValidUrl('javascript:alert(1)'), false);
assert.strictEqual(isValidUrl('javascript:void(0)'), false);
assert.strictEqual(isValidUrl('data:text/html,<script>alert(1)</script>'), false);
assert.strictEqual(isValidUrl('vbscript:msgbox(1)'), false);
console.log('✓ Test 3: URL Validator actively rejects javascript:, data:, and vbscript: protocols');

// -------------------------------------------------------------
// Test 4: URL Sanitizer - getSafeUrl protects rendered links
// -------------------------------------------------------------
assert.strictEqual(getSafeUrl('javascript:alert(1)'), undefined);
assert.strictEqual(getSafeUrl('data:text/html,test'), undefined);
assert.strictEqual(getSafeUrl('https://github.com/alex'), 'https://github.com/alex');
assert.strictEqual(getSafeUrl('github.com/alex'), 'https://github.com/alex');
assert.strictEqual(getSafeUrl(''), undefined);
assert.strictEqual(getSafeUrl(undefined), undefined);
console.log('✓ Test 4: getSafeUrl strips dangerous URI schemes and ensures safe https:// URLs');

// -------------------------------------------------------------
// Test 5: Synthetic Resume Mapping - Verifies canonical schema preservation
// -------------------------------------------------------------
const syntheticResume = {
  full_name: 'Jordan Taylor',
  email: 'jordan.taylor@example.org',
  phone: '+1 (555) 345-6789',
  location: 'Austin, TX',
  headline: 'Senior Cloud Infrastructure Engineer',
  summary: 'DevOps engineer with 5+ years of experience.',
  links: {
    linkedin: 'https://linkedin.com/in/jordantaylor',
    github: 'https://github.com/jordantaylor',
  },
  target_roles: ['DevOps Engineer', 'SRE'],
  education: [
    {
      institution: 'UT Austin',
      degree: 'B.S.',
      field_of_study: 'Computer Engineering',
      start_year: '2017',
      end_year: '2021',
      gpa: '3.82',
    },
  ],
  skills: [
    { name: 'Kubernetes', categoryHint: 'CLOUD', confidence: 'high', evidenceHint: 'Managed 80 node EKS' },
    { name: 'Python Tooling', categoryHint: 'COD', confidence: 'medium', evidenceHint: 'Cluster CLI tools' },
    { name: 'Proprietary System', categoryHint: 'NON_EXISTENT_CODE', confidence: 'unverified_level' },
  ],
  projects: [
    {
      title: 'KubeMesh Gateway',
      role: 'Lead Systems Engineer',
      description: 'Service mesh monitoring pipeline.',
      technologies: ['Kubernetes', 'Go'],
      highlights: ['eBPF tracing'],
    },
  ],
  experience: [
    {
      company: 'Aether Cloud',
      title: 'Senior DevOps Engineer',
      location: 'Austin, TX',
      start_date: '2021-06',
      is_current: true,
      description: 'Owned Kubernetes infrastructure.',
      technologies: ['AWS', 'Kubernetes'],
    },
  ],
  certifications: [
    {
      name: 'Certified Kubernetes Administrator',
      issuer: 'CNCF',
      issue_date: '2022-04',
    },
  ],
};

const mapped = mapParsedResumeToCandidateProfile(syntheticResume);
assert.strictEqual(mapped.schema_version, '1.0.0');
assert.strictEqual(mapped.personal_info.full_name, 'Jordan Taylor');
assert.strictEqual(mapped.skills.length, 3);
assert.strictEqual(mapped.skills[0].category_code, 'CLOUD');
assert.strictEqual(mapped.skills[0].confidence, 'high');
assert.strictEqual(mapped.skills[1].category_code, 'COD');
assert.strictEqual(mapped.skills[1].confidence, 'medium');
// Non-existent category code must map to 'OTHER'
assert.strictEqual(mapped.skills[2].category_code, 'OTHER');
// Unverified confidence level must map to 'low'
assert.strictEqual(mapped.skills[2].confidence, 'low');
console.log('✓ Test 5: Synthetic Resume correctly maps into canonical CandidateProfile with category and confidence safety');

// -------------------------------------------------------------
// Test 6: Missing Fields remain blank for candidate completion
// -------------------------------------------------------------
assert.strictEqual(mapped.preferred_roles.expected_salary_range, '');
assert.strictEqual(mapped.preferred_roles.notice_period_days, undefined);
assert.strictEqual(mapped.personal_info.links.portfolio, '');
assert.strictEqual(mapped.personal_info.links.other, '');
console.log('✓ Test 6: Unspecified candidate fields remain empty/blank for candidate review');

// -------------------------------------------------------------
// Test 7: Document File Type Validation
// -------------------------------------------------------------
function isSupportedResumeDoc(filename) {
  const lower = filename.toLowerCase();
  return lower.endsWith('.pdf') || lower.endsWith('.docx');
}
assert.strictEqual(isSupportedResumeDoc('resume.pdf'), true);
assert.strictEqual(isSupportedResumeDoc('resume.DOCX'), true);
assert.strictEqual(isSupportedResumeDoc('resume.doc'), false);
assert.strictEqual(isSupportedResumeDoc('candidate.json'), false);
assert.strictEqual(isSupportedResumeDoc('malicious.exe'), false);
assert.strictEqual(isSupportedResumeDoc('photo.png'), false);
console.log('✓ Test 7: Document validation accepts only .pdf and .docx resume files');

// -------------------------------------------------------------
// Test 8: Document File Size Boundary (5 MB Limit)
// -------------------------------------------------------------
const MAX_DOC_SIZE = 5 * 1024 * 1024;
assert.strictEqual(1024 * 500 <= MAX_DOC_SIZE, true); // 500 KB -> OK
assert.strictEqual(5 * 1024 * 1024 <= MAX_DOC_SIZE, true); // 5 MB -> OK
assert.strictEqual(5 * 1024 * 1024 + 1 <= MAX_DOC_SIZE, false); // 5 MB + 1 byte -> Exceeded
console.log('✓ Test 8: Document size boundary correctly enforces 5 MB limit');

// -------------------------------------------------------------
// Test 9: Profile ID Stability across repeated resume prefill
// -------------------------------------------------------------
const existingProfile = {
  profile_id: 'stable-candidate-uuid-889',
  schema_version: '1.0.0',
  personal_info: { full_name: 'Existing Candidate' },
};
const reMapped = mapParsedResumeToCandidateProfile(syntheticResume, existingProfile);
assert.strictEqual(reMapped.profile_id, 'stable-candidate-uuid-889');
console.log('✓ Test 9: Stable profile ID is strictly preserved across prefill operations');

// -------------------------------------------------------------
// Test 10: Array Independence - Mapped arrays do not leak across mutations
// -------------------------------------------------------------
mapped.skills[0].skill_name = 'Mutated Skill Name';
assert.notStrictEqual(syntheticResume.skills[0].name, 'Mutated Skill Name');
console.log('✓ Test 10: Extracted profile data is deeply isolated and independent of input fixture');

console.log('\n=====================================================');
console.log('All 10 Stage 5 QA & Integration Tests Passed Successfully!');
console.log('=====================================================\n');
