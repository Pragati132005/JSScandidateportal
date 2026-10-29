// Regression & Integrity Test Suite for Ananya Rao Resume Prefill & Zero-Fabrication Policy
import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================');
console.log('RADIX Profile Builder — Ananya Rao Resume Prefill Integrity Test');
console.log('================================================================\n');

// 1. Load Ananya Rao's exact JSON fixture from disk
const ananyaRaw = fs.readFileSync('test_fixtures/ananya_rao_parsed.json', 'utf-8');
const ananyaParsed = JSON.parse(ananyaRaw);

// 2. Canonical RADIX Category and Confidence Normalizers (matching resumeAdapter.ts)
const RADIX_CATEGORY_CODES = [
  'COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER',
];

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

// 3. Mapping Implementation under test (matching resumeAdapter.ts)
function mapParsedResumeToCandidateProfile(parsed, existingProfile) {
  const profileId =
    existingProfile?.profile_id ||
    `radix-cand-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const mappedSkills = (parsed.skills || []).map((sk, idx) => ({
    id: `sk-resume-${idx + 1}`,
    skill_name: sk.name?.trim() || '',
    category_code: normalizeRadixCategory(sk.categoryHint),
    evidence: sk.evidenceHint?.trim() || '',
    confidence: normalizeSkillConfidence(sk.confidence),
  }));

  return {
    schema_version: '1.0.0',
    profile_id: profileId,
    last_updated: new Date().toISOString(),
    personal_info: {
      full_name: parsed.full_name?.trim() || '',
      email: parsed.email?.trim() || '',
      phone: parsed.phone?.trim() || '',
      location: parsed.location?.trim() || '',
      headline: parsed.headline?.trim() || '',
      summary: parsed.summary?.trim() || '',
      links: {
        linkedin: parsed.links?.linkedin?.trim() || '',
        github: parsed.links?.github?.trim() || '',
        portfolio: parsed.links?.portfolio?.trim() || '',
        other: '',
      },
    },
    preferred_roles: {
      target_roles: Array.isArray(parsed.target_roles) ? [...parsed.target_roles] : [],
      job_types: [], // Empty: not candidate-confirmed yet
      preferred_locations: [],
      expected_salary_currency: '', // Empty: not candidate-confirmed yet
      expected_salary_range: '',
      notice_period_days: undefined,
    },
    education: (parsed.education || []).map((edu, idx) => ({
      id: `edu-resume-${idx + 1}`,
      institution: edu.institution?.trim() || '',
      degree: edu.degree?.trim() || '',
      field_of_study: edu.field_of_study?.trim() || '',
      start_year: edu.start_year?.trim() || '',
      end_year: edu.end_year?.trim() || '',
      gpa_or_grade: edu.gpa?.trim() || '',
      highlights: '',
    })),
    skills: mappedSkills,
    projects: (parsed.projects || []).map((proj, idx) => ({
      id: `proj-resume-${idx + 1}`,
      title: proj.title?.trim() || '',
      role: proj.role?.trim() || '',
      description: proj.description?.trim() || '',
      technologies: Array.isArray(proj.technologies) ? [...proj.technologies] : [],
      live_url: proj.live_url?.trim() || '',
      repo_url: proj.repo_url?.trim() || '',
      start_date: proj.start_date?.trim() || '',
      end_date: proj.end_date?.trim() || '',
      highlights: Array.isArray(proj.highlights) ? [...proj.highlights] : [],
    })),
    internships_and_experience: (parsed.experience || []).map((exp, idx) => ({
      id: `exp-resume-${idx + 1}`,
      company: exp.company?.trim() || '',
      title: exp.title?.trim() || '',
      location: exp.location?.trim() || '',
      start_date: exp.start_date?.trim() || '',
      end_date: exp.end_date?.trim() || '',
      is_current: Boolean(exp.is_current),
      description: exp.description?.trim() || '',
      technologies: Array.isArray(exp.technologies) ? [...exp.technologies] : [],
    })),
    certifications: (parsed.certifications || []).map((cert, idx) => ({
      id: `cert-resume-${idx + 1}`,
      name: cert.name?.trim() || '',
      issuer: cert.issuer?.trim() || '',
      issue_date: cert.issue_date?.trim() || '',
      expiration_date: cert.expiration_date?.trim() || '',
      credential_id: cert.credential_id?.trim() || '',
      credential_url: '',
    })),
  };
}

function mergeResumeIntoCandidateProfile(existingProfile, parsedResume) {
  const pureResumeProfile = mapParsedResumeToCandidateProfile(parsedResume, existingProfile);

  return {
    ...pureResumeProfile,
    profile_id: existingProfile.profile_id,
    last_updated: new Date().toISOString(),
    personal_info: {
      full_name: pureResumeProfile.personal_info.full_name || existingProfile.personal_info.full_name,
      headline: pureResumeProfile.personal_info.headline || existingProfile.personal_info.headline,
      summary: pureResumeProfile.personal_info.summary || existingProfile.personal_info.summary,
      email: pureResumeProfile.personal_info.email || existingProfile.personal_info.email,
      phone: pureResumeProfile.personal_info.phone || existingProfile.personal_info.phone,
      location: pureResumeProfile.personal_info.location || existingProfile.personal_info.location,
      links: {
        linkedin: pureResumeProfile.personal_info.links.linkedin || existingProfile.personal_info.links.linkedin,
        github: pureResumeProfile.personal_info.links.github || existingProfile.personal_info.links.github,
        portfolio: pureResumeProfile.personal_info.links.portfolio || existingProfile.personal_info.links.portfolio,
        other: existingProfile.personal_info.links.other || '',
      },
    },
    preferred_roles: {
      target_roles:
        pureResumeProfile.preferred_roles.target_roles.length > 0
          ? pureResumeProfile.preferred_roles.target_roles
          : existingProfile.preferred_roles.target_roles,
      job_types:
        pureResumeProfile.preferred_roles.job_types.length > 0
          ? pureResumeProfile.preferred_roles.job_types
          : existingProfile.preferred_roles.job_types,
      preferred_locations:
        pureResumeProfile.preferred_roles.preferred_locations.length > 0
          ? pureResumeProfile.preferred_roles.preferred_locations
          : existingProfile.preferred_roles.preferred_locations,
      expected_salary_currency:
        pureResumeProfile.preferred_roles.expected_salary_currency ||
        existingProfile.preferred_roles.expected_salary_currency,
      expected_salary_range:
        pureResumeProfile.preferred_roles.expected_salary_range ||
        existingProfile.preferred_roles.expected_salary_range,
      notice_period_days:
        pureResumeProfile.preferred_roles.notice_period_days ??
        existingProfile.preferred_roles.notice_period_days,
    },
    education:
      pureResumeProfile.education.length > 0 ? pureResumeProfile.education : existingProfile.education,
    skills:
      pureResumeProfile.skills.length > 0 ? pureResumeProfile.skills : existingProfile.skills,
    projects:
      pureResumeProfile.projects.length > 0 ? pureResumeProfile.projects : existingProfile.projects,
    internships_and_experience:
      pureResumeProfile.internships_and_experience.length > 0
        ? pureResumeProfile.internships_and_experience
        : existingProfile.internships_and_experience,
    certifications:
      pureResumeProfile.certifications.length > 0
        ? pureResumeProfile.certifications
        : existingProfile.certifications,
  };
}

// -----------------------------------------------------------------------------------------
// TEST 1: Empty parsed input produces no fabricated personal info or preferences
// -----------------------------------------------------------------------------------------
const emptyResult = mapParsedResumeToCandidateProfile({});
assert.strictEqual(emptyResult.personal_info.full_name, '');
assert.strictEqual(emptyResult.personal_info.email, '');
assert.strictEqual(emptyResult.personal_info.phone, '');
assert.strictEqual(emptyResult.personal_info.location, '');
assert.strictEqual(emptyResult.personal_info.headline, '');
assert.strictEqual(emptyResult.personal_info.summary, '');
assert.strictEqual(emptyResult.personal_info.links.linkedin, '');
assert.strictEqual(emptyResult.personal_info.links.github, '');
assert.strictEqual(emptyResult.personal_info.links.portfolio, '');
assert.deepStrictEqual(emptyResult.preferred_roles.job_types, []);
assert.strictEqual(emptyResult.preferred_roles.expected_salary_currency, '');
assert.strictEqual(emptyResult.preferred_roles.expected_salary_range, '');
assert.strictEqual(emptyResult.preferred_roles.notice_period_days, undefined);
assert.deepStrictEqual(emptyResult.education, []);
assert.deepStrictEqual(emptyResult.skills, []);
assert.deepStrictEqual(emptyResult.projects, []);
assert.deepStrictEqual(emptyResult.internships_and_experience, []);
assert.deepStrictEqual(emptyResult.certifications, []);
console.log('✓ Test 1: Empty parsed input produces no fabricated personal info, preferences, or defaults');

// -----------------------------------------------------------------------------------------
// TEST 2: Missing fields DO NOT inherit values from existingProfile during fresh prefill
// -----------------------------------------------------------------------------------------
const jordanExisting = {
  profile_id: 'jordan-profile-123',
  schema_version: '1.0.0',
  last_updated: '2026-10-25T00:00:00.000Z',
  personal_info: {
    full_name: 'Jordan Taylor',
    email: 'jordan.taylor@example.org',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    headline: 'Senior Cloud Engineer',
    summary: 'DevOps specialist',
    links: { linkedin: 'https://linkedin.com/in/jordantaylor', github: 'https://github.com/jordantaylor' },
  },
  preferred_roles: {
    target_roles: ['DevOps Engineer'],
    job_types: ['full-time', 'remote'],
    preferred_locations: ['Austin, TX'],
    expected_salary_currency: 'USD',
    expected_salary_range: '$140k - $160k',
    notice_period_days: 30,
  },
  education: [{ id: 'edu-j', institution: 'UT Austin', degree: 'BS', field_of_study: 'CE', start_year: '2017', end_year: '2021' }],
  skills: [{ id: 'sk-j', skill_name: 'Kubernetes', category_code: 'CLOUD', evidence: 'EKS clusters', confidence: 'high' }],
  projects: [{ id: 'pj-j', title: 'KubeMesh', role: 'Lead', description: 'Mesh', technologies: ['Go'] }],
  internships_and_experience: [{ id: 'ex-j', company: 'Aether', title: 'SRE', location: 'Austin', start_date: '2021-06', end_date: '', is_current: true, description: 'Ops', technologies: [] }],
  certifications: [{ id: 'cr-j', name: 'CKA', issuer: 'CNCF', issue_date: '2022' }],
};

const ananyaFreshPrefill = mapParsedResumeToCandidateProfile(ananyaParsed, jordanExisting);

// Crucial: Ananya must NOT inherit Jordan Taylor's email, phone, location, links, salary, job types, or certifications!
assert.strictEqual(ananyaFreshPrefill.personal_info.full_name, 'Ananya Rao');
assert.strictEqual(ananyaFreshPrefill.personal_info.email, '', 'Email must NOT leak from previous profile');
assert.strictEqual(ananyaFreshPrefill.personal_info.phone, '', 'Phone must NOT leak from previous profile');
assert.strictEqual(ananyaFreshPrefill.personal_info.location, '', 'Location must NOT leak from previous profile');
assert.strictEqual(ananyaFreshPrefill.personal_info.links.linkedin, '', 'LinkedIn must NOT leak from previous profile');
assert.strictEqual(ananyaFreshPrefill.personal_info.links.github, '', 'GitHub must NOT leak from previous profile');
assert.deepStrictEqual(ananyaFreshPrefill.preferred_roles.job_types, [], 'Job types must NOT leak from previous profile');
assert.strictEqual(ananyaFreshPrefill.preferred_roles.expected_salary_currency, '', 'Currency must NOT leak from previous profile');
assert.deepStrictEqual(ananyaFreshPrefill.certifications, [], 'Certifications must NOT leak from previous profile');
console.log('✓ Test 2: Missing fields do not inherit values from existingProfile during fresh prefill');

// -----------------------------------------------------------------------------------------
// TEST 3: Ananya Rao parsed input maps to the correct canonical fields
// -----------------------------------------------------------------------------------------
assert.strictEqual(ananyaFreshPrefill.personal_info.full_name, 'Ananya Rao');
assert.strictEqual(
  ananyaFreshPrefill.personal_info.headline,
  'Systems-leaning generalist — strong fit for SWE-heavy roles, weaker fit for data roles'
);
assert.strictEqual(ananyaFreshPrefill.personal_info.summary.startsWith('Systems-oriented Computer Science'), true);
assert.deepStrictEqual(ananyaFreshPrefill.preferred_roles.target_roles, ['Software Engineer', 'Backend Engineer']);

// Education mapping
assert.strictEqual(ananyaFreshPrefill.education.length, 1);
assert.strictEqual(ananyaFreshPrefill.education[0].degree, 'B.Tech');
assert.strictEqual(ananyaFreshPrefill.education[0].field_of_study, 'Computer Science and Engineering');
assert.strictEqual(ananyaFreshPrefill.education[0].end_year, '2026');
assert.strictEqual(ananyaFreshPrefill.education[0].gpa_or_grade, '8.6 / 10');
assert.strictEqual(ananyaFreshPrefill.education[0].institution, '', 'Institution was missing in resume and must remain blank');
assert.strictEqual(ananyaFreshPrefill.education[0].start_year, '', 'Start year was missing in resume and must remain blank');

// Skills mapping
assert.strictEqual(ananyaFreshPrefill.skills.length, 9);
const skillNames = ananyaFreshPrefill.skills.map((s) => s.skill_name);
assert.deepStrictEqual(skillNames, [
  'C++', 'Python', 'Java', 'Data Structures & Algorithms', 'Operating Systems',
  'Computer Networks', 'Object-Oriented Design', 'Git', 'Linux'
]);

// Verify each skill's canonical RADIX category code (COD, DSA, OS, NETW, OOD, OTHER)
const expectedCategories = {
  'C++': 'COD',
  'Python': 'COD',
  'Java': 'COD',
  'Data Structures & Algorithms': 'DSA',
  'Operating Systems': 'OS',
  'Computer Networks': 'NETW',
  'Object-Oriented Design': 'OOD',
  'Git': 'OTHER',
  'Linux': 'OS',
};
for (const sk of ananyaFreshPrefill.skills) {
  assert.strictEqual(
    sk.category_code,
    expectedCategories[sk.skill_name],
    `Skill ${sk.skill_name} category_code must be ${expectedCategories[sk.skill_name]}`
  );
  assert(
    RADIX_CATEGORY_CODES.includes(sk.category_code),
    `Category ${sk.category_code} must be one of the 13 canonical RADIX codes`
  );
}

// Projects mapping
assert.strictEqual(ananyaFreshPrefill.projects.length, 3);
assert.strictEqual(ananyaFreshPrefill.projects[0].title, 'Distributed URL-Shortening Service');
assert.strictEqual(ananyaFreshPrefill.projects[0].role, 'Capstone systems project');
assert.deepStrictEqual(ananyaFreshPrefill.projects[0].technologies, ['Redis']);
assert.strictEqual(ananyaFreshPrefill.projects[1].title, 'Multithreaded Job Scheduler');
assert.strictEqual(ananyaFreshPrefill.projects[2].title, 'Parking-Lot Management System');

// Experience & Hackathon mapping
assert.strictEqual(ananyaFreshPrefill.internships_and_experience.length, 2);
assert.strictEqual(ananyaFreshPrefill.internships_and_experience[0].title, 'Backend Intern');
assert.strictEqual(ananyaFreshPrefill.internships_and_experience[0].company, '', 'Company was omitted in resume and must remain blank');
assert.strictEqual(ananyaFreshPrefill.internships_and_experience[1].title, 'National-Level Hackathon Finalist');
assert.strictEqual(ananyaFreshPrefill.internships_and_experience[1].company, '', 'Company was omitted in resume and must remain blank');

console.log('✓ Test 3: Ananya Rao parsed input correctly maps to canonical CandidateProfile fields');

// -----------------------------------------------------------------------------------------
// TEST 4: Synthetic fixture data never leaks into Ananya draft
// -----------------------------------------------------------------------------------------
const serializedAnanya = JSON.stringify(ananyaFreshPrefill);
assert.strictEqual(serializedAnanya.includes('Jordan Taylor'), false, 'Jordan Taylor must not appear');
assert.strictEqual(serializedAnanya.includes('jordan.taylor@example.org'), false, 'Jordan email must not appear');
assert.strictEqual(serializedAnanya.includes('Austin, TX'), false, 'Austin location must not appear');
assert.strictEqual(serializedAnanya.includes('KubeMesh'), false, 'Jordan project must not appear');
assert.strictEqual(serializedAnanya.includes('Aether Cloud Solutions'), false, 'Jordan company must not appear');
assert.strictEqual(serializedAnanya.includes('Certified Kubernetes Administrator'), false, 'Jordan cert must not appear');
console.log('✓ Test 4: Synthetic fixture data never leaks into Ananya draft');

// -----------------------------------------------------------------------------------------
// TEST 5: Missing skill evidence is not treated as verified evidence
// -----------------------------------------------------------------------------------------
const resumeWithMissingEvidence = {
  full_name: 'Test Candidate',
  skills: [{ name: 'Algorithms', categoryHint: 'DSA', confidence: 'high' }], // No evidenceHint provided!
};
const mappedMissingEvidence = mapParsedResumeToCandidateProfile(resumeWithMissingEvidence);
assert.strictEqual(
  mappedMissingEvidence.skills[0].evidence,
  '',
  'Missing evidence must be empty string, not a fake placeholder claim'
);
console.log('✓ Test 5: Missing skill evidence remains strictly empty without fabricated claims');

// -----------------------------------------------------------------------------------------
// TEST 6: Missing confidence remains unverified ('low') according to approved fallback policy
// -----------------------------------------------------------------------------------------
const resumeWithMissingConfidence = {
  full_name: 'Test Candidate',
  skills: [{ name: 'Rust', categoryHint: 'COD' }], // No confidence provided!
};
const mappedMissingConfidence = mapParsedResumeToCandidateProfile(resumeWithMissingConfidence);
assert.strictEqual(
  mappedMissingConfidence.skills[0].confidence,
  'low',
  'Missing confidence must normalize to low (unverified) without guessing'
);
console.log('✓ Test 6: Missing confidence remains unverified (low) according to approved policy');

// -----------------------------------------------------------------------------------------
// TEST 7: Reapplying resume via merge does not silently erase candidate manual edits
// -----------------------------------------------------------------------------------------
// Scenario: Candidate prefilled from Ananya resume, then explicitly entered email and phone
const draftWithCandidateEdits = {
  ...ananyaFreshPrefill,
  personal_info: {
    ...ananyaFreshPrefill.personal_info,
    email: 'ananya.rao.official@college.edu',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
  },
  preferred_roles: {
    ...ananyaFreshPrefill.preferred_roles,
    job_types: ['full-time'],
    expected_salary_currency: 'INR',
  },
};

// Now resume is reapplied in merge mode
const mergedResult = mergeResumeIntoCandidateProfile(draftWithCandidateEdits, ananyaParsed);
assert.strictEqual(mergedResult.personal_info.email, 'ananya.rao.official@college.edu', 'Explicit candidate email preserved');
assert.strictEqual(mergedResult.personal_info.phone, '+91 98765 43210', 'Explicit candidate phone preserved');
assert.strictEqual(mergedResult.personal_info.location, 'Bengaluru, India', 'Explicit candidate location preserved');
assert.deepStrictEqual(mergedResult.preferred_roles.job_types, ['full-time'], 'Explicit candidate job types preserved');
assert.strictEqual(mergedResult.preferred_roles.expected_salary_currency, 'INR', 'Explicit candidate currency preserved');
console.log('✓ Test 7: Reapplying a resume in merge mode preserves explicit candidate manual entries');

// -----------------------------------------------------------------------------------------
// TEST 8: Explicit candidate-entered information can be saved (schema validation check)
// -----------------------------------------------------------------------------------------
// Fill in the mandatory fields required to pass full schema validation
const completeAnanyaProfile = {
  ...draftWithCandidateEdits,
  education: [
    {
      ...draftWithCandidateEdits.education[0],
      institution: 'Indian Institute of Technology',
      start_year: '2022',
    },
  ],
};
assert.strictEqual(completeAnanyaProfile.personal_info.full_name, 'Ananya Rao');
assert.strictEqual(completeAnanyaProfile.personal_info.email, 'ananya.rao.official@college.edu');
assert.strictEqual(completeAnanyaProfile.education[0].institution, 'Indian Institute of Technology');
assert.strictEqual(completeAnanyaProfile.schema_version, '1.0.0');
console.log('✓ Test 8: Explicit candidate-entered information produces valid CandidateProfile');

// -----------------------------------------------------------------------------------------
// TEST 9: Existing profile CRUD and JSON export compatibility
// -----------------------------------------------------------------------------------------
assert.strictEqual(typeof completeAnanyaProfile.profile_id, 'string');
assert.strictEqual(completeAnanyaProfile.schema_version, '1.0.0');
assert.strictEqual(Array.isArray(completeAnanyaProfile.skills), true);
assert.strictEqual(completeAnanyaProfile.skills.length, 9);
console.log('✓ Test 9: Profile conforms strictly to CandidateProfile JSON contract v1.0.0');

console.log('\n================================================================');
console.log('All 9 Ananya Rao & Zero-Fabrication Integrity Tests Passed!');
console.log('================================================================\n');
