// Test Suite: Module 2 Resume Parser Integration & Priya Menon Integrity Tests
import assert from 'node:assert';
import fs from 'node:fs';

console.log('================================================================');
console.log('RADIX Profile Builder — Module 2 / Priya Menon Integration Tests');
console.log('================================================================\n');

// 1. Load fixtures from disk
const priyaRaw = fs.readFileSync('priya_menon.parse.json', 'utf-8');
const priyaParsed = JSON.parse(priyaRaw);

const ananyaRaw = fs.readFileSync('test_fixtures/ananya_rao_parsed.json', 'utf-8');
const ananyaParsed = JSON.parse(ananyaRaw);

// 2. Canonical RADIX Category Codes and Confidence Normalizers
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

// 3. Module 2 Adapter functions under test
function validateModule2Output(raw) {
  const errors = [];
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { isValid: false, errors: ['Input must be a valid non-null JSON object.'] };
  }
  const obj = raw;
  if ('schema_version' in obj && obj.schema_version !== null && typeof obj.schema_version !== 'string') {
    errors.push("'schema_version' must be a string or null.");
  }
  if ('source_type' in obj && obj.source_type !== null && typeof obj.source_type !== 'string') {
    errors.push("'source_type' must be a string or null.");
  }
  if ('skills' in obj && obj.skills !== null && !Array.isArray(obj.skills)) {
    errors.push("'skills' must be an array.");
  }
  if ('profile_prefill' in obj && obj.profile_prefill !== null && typeof obj.profile_prefill !== 'object') {
    errors.push("'profile_prefill' must be an object or null.");
  }
  if ('details' in obj && obj.details !== null && typeof obj.details !== 'object') {
    errors.push("'details' must be an object or null.");
  }
  return { isValid: errors.length === 0, errors, parsed: raw };
}

function extractModule2Metadata(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const rawObj = raw;
  const metaObj = (typeof rawObj.meta === 'object' && rawObj.meta !== null ? rawObj.meta : {});

  const parseWarnings = Array.isArray(metaObj.parse_warnings)
    ? metaObj.parse_warnings.filter((w) => typeof w === 'string')
    : undefined;

  const categoriesWithoutEvidence = Array.isArray(metaObj.categories_without_evidence)
    ? metaObj.categories_without_evidence.filter((c) => typeof c === 'string')
    : undefined;

  const fieldConfidence =
    typeof metaObj.field_confidence === 'object' && metaObj.field_confidence !== null
      ? Object.fromEntries(
          Object.entries(metaObj.field_confidence)
            .filter(([, v]) => typeof v === 'string')
            .map(([k, v]) => [k, String(v)])
        )
      : undefined;

  const rawSkills = Array.isArray(rawObj.skills)
    ? rawObj.skills
    : typeof rawObj.profile_prefill === 'object' && rawObj.profile_prefill !== null && Array.isArray(rawObj.profile_prefill.skills)
      ? rawObj.profile_prefill.skills
      : [];

  const skillMetadata = rawSkills
    .filter((s) => typeof s === 'object' && s !== null)
    .map((s) => ({
      skill_name: typeof s.skill_name === 'string' ? s.skill_name.trim() : (typeof s.name === 'string' ? s.name.trim() : ''),
      source_section: typeof s.source_section === 'string' ? s.source_section.trim() : undefined,
      evidence_verified: typeof s.evidence_verified === 'boolean' ? s.evidence_verified : undefined,
      confidence: typeof s.confidence === 'string' ? s.confidence.trim() : undefined,
    }))
    .filter((sm) => sm.skill_name.length > 0);

  const rawPrefill =
    typeof rawObj.profile_prefill === 'object' && rawObj.profile_prefill !== null
      ? rawObj.profile_prefill
      : undefined;

  const rawDetails =
    typeof rawObj.details === 'object' && rawObj.details !== null
      ? rawObj.details
      : undefined;

  const hackathons = Array.isArray(rawPrefill?.hackathons)
    ? rawPrefill.hackathons
        .filter((h) => typeof h === 'object' && h !== null)
        .map((h) => ({
          title: typeof h.title === 'string' ? h.title.trim() : null,
          result: typeof h.result === 'string' ? h.result.trim() : null,
          kind: typeof h.kind === 'string' ? h.kind.trim() : null,
          description: typeof h.description === 'string' ? h.description.trim() : null,
        }))
    : undefined;

  const achievements = Array.isArray(rawDetails?.achievements)
    ? rawDetails.achievements
        .filter((a) => typeof a === 'string' && a.trim().length > 0)
        .map((a) => a.trim())
    : undefined;

  return {
    schema_version: typeof rawObj.schema_version === 'string' ? rawObj.schema_version : undefined,
    source_type: typeof rawObj.source_type === 'string' ? rawObj.source_type : undefined,
    source_file: typeof rawObj.source_file === 'string' ? rawObj.source_file : undefined,
    parser_version: typeof metaObj.parser_version === 'string' ? metaObj.parser_version : undefined,
    prompt_version: typeof metaObj.prompt_version === 'string' ? metaObj.prompt_version : undefined,
    taxonomy_version: typeof metaObj.taxonomy_version === 'string' ? metaObj.taxonomy_version : undefined,
    model_used: typeof metaObj.model_used === 'string' ? metaObj.model_used : undefined,
    from_cache: typeof metaObj.from_cache === 'boolean' ? metaObj.from_cache : undefined,
    input_format: typeof metaObj.input_format === 'string' ? metaObj.input_format : undefined,
    parse_warnings: parseWarnings,
    categories_without_evidence: categoriesWithoutEvidence,
    field_confidence: fieldConfidence,
    processing_ms: typeof metaObj.processing_ms === 'number' ? metaObj.processing_ms : undefined,
    skill_metadata: skillMetadata.length > 0 ? skillMetadata : undefined,
    hackathons: hackathons && hackathons.length > 0 ? hackathons : undefined,
    achievements: achievements && achievements.length > 0 ? achievements : undefined,
  };
}

function mapModule2OutputToParsedResumeInput(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { education: [], skills: [], projects: [], experience: [], certifications: [] };
  }

  const rawObj = raw;
  const prefill = typeof rawObj.profile_prefill === 'object' && rawObj.profile_prefill !== null ? rawObj.profile_prefill : undefined;
  const details = typeof rawObj.details === 'object' && rawObj.details !== null ? rawObj.details : undefined;

  const full_name = typeof prefill?.name === 'string' && prefill.name.trim() ? prefill.name.trim() : undefined;
  const email = typeof prefill?.email === 'string' && prefill.email.trim() ? prefill.email.trim() : undefined;
  const phone = typeof details?.phone === 'string' && details.phone.trim() ? details.phone.trim() : undefined;

  const rawEducation = Array.isArray(details?.education_details) ? details.education_details : [];
  const education = rawEducation
    .filter((item) => typeof item === 'object' && item !== null)
    .map((edu) => ({
      institution: typeof edu.institution === 'string' ? edu.institution.trim() : '',
      degree: typeof edu.degree === 'string' ? edu.degree.trim() : '',
      field_of_study: typeof edu.field === 'string' && edu.field.trim()
        ? edu.field.trim()
        : typeof edu.field_of_study === 'string'
          ? edu.field_of_study.trim()
          : '',
      start_year: edu.start_year != null && String(edu.start_year).trim() ? String(edu.start_year).trim() : '',
      end_year: edu.graduation_year != null && String(edu.graduation_year).trim()
        ? String(edu.graduation_year).trim()
        : edu.end_year != null && String(edu.end_year).trim()
          ? String(edu.end_year).trim()
          : '',
      gpa: typeof edu.grade === 'string' && edu.grade.trim()
        ? edu.grade.trim()
        : typeof edu.gpa === 'string' && edu.gpa.trim()
          ? edu.gpa.trim()
          : undefined,
    }));

  const rawSkills = Array.isArray(rawObj.skills)
    ? rawObj.skills
    : Array.isArray(prefill?.skills)
      ? prefill.skills
      : [];

  const skills = rawSkills
    .filter((sk) => typeof sk === 'object' && sk !== null)
    .map((sk) => {
      const name = typeof sk.skill_name === 'string' && sk.skill_name.trim()
        ? sk.skill_name.trim()
        : typeof sk.name === 'string' && sk.name.trim()
          ? sk.name.trim()
          : '';

      const rawCategory = typeof sk.category_code === 'string' ? sk.category_code : sk.categoryHint;
      const rawEvidence = typeof sk.evidence === 'string' && sk.evidence.trim()
        ? sk.evidence.trim()
        : typeof sk.evidenceHint === 'string' && sk.evidenceHint.trim()
          ? sk.evidenceHint.trim()
          : undefined;

      return {
        name,
        categoryHint: normalizeRadixCategory(rawCategory),
        evidenceHint: rawEvidence,
        confidence: normalizeSkillConfidence(typeof sk.confidence === 'string' ? sk.confidence : undefined),
      };
    })
    .filter((s) => s.name.length > 0);

  const rawProjects = Array.isArray(details?.projects) ? details.projects : [];
  const projects = rawProjects
    .filter((p) => typeof p === 'object' && p !== null)
    .map((proj) => ({
      title: typeof proj.title === 'string' ? proj.title.trim() : '',
      role: typeof proj.role === 'string' ? proj.role.trim() : '',
      description: typeof proj.description === 'string' ? proj.description.trim() : '',
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.filter((t) => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
        : [],
      live_url: typeof proj.live_url === 'string' && proj.live_url.trim() ? proj.live_url.trim() : undefined,
      repo_url: typeof proj.repo_url === 'string' && proj.repo_url.trim() ? proj.repo_url.trim() : undefined,
      start_date: typeof proj.start_date === 'string' && proj.start_date.trim() ? proj.start_date.trim() : undefined,
      end_date: typeof proj.end_date === 'string' && proj.end_date.trim() ? proj.end_date.trim() : undefined,
      highlights: Array.isArray(proj.highlights)
        ? proj.highlights.filter((h) => typeof h === 'string' && h.trim().length > 0).map((h) => h.trim())
        : undefined,
    }));

  const rawExperience = Array.isArray(details?.experience)
    ? details.experience
    : Array.isArray(prefill?.internships)
      ? prefill.internships
      : [];

  const experience = rawExperience
    .filter((exp) => typeof exp === 'object' && exp !== null)
    .map((exp) => ({
      company: typeof exp.company === 'string' && exp.company.trim()
        ? exp.company.trim()
        : typeof exp.organization === 'string' && exp.organization.trim()
          ? exp.organization.trim()
          : '',
      title: typeof exp.title === 'string' && exp.title.trim()
        ? exp.title.trim()
        : typeof exp.role === 'string' && exp.role.trim()
          ? exp.role.trim()
          : '',
      location: typeof exp.location === 'string' ? exp.location.trim() : '',
      start_date: typeof exp.start_date === 'string' ? exp.start_date.trim() : '',
      end_date: typeof exp.end_date === 'string' ? exp.end_date.trim() : '',
      is_current: Boolean(exp.is_current),
      description: typeof exp.description === 'string' ? exp.description.trim() : '',
      technologies: Array.isArray(exp.technologies)
        ? exp.technologies.filter((t) => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
        : [],
    }));

  const target_roles = Array.isArray(prefill?.preferred_roles)
    ? prefill.preferred_roles.filter((r) => typeof r === 'string' && r.trim().length > 0).map((r) => r.trim())
    : undefined;

  const rawCertifications = Array.isArray(prefill?.certifications) ? prefill.certifications : [];
  const certifications = rawCertifications
    .map((cert) => {
      if (typeof cert === 'string' && cert.trim().length > 0) {
        return { name: cert.trim(), issuer: '', issue_date: '' };
      }
      if (typeof cert === 'object' && cert !== null) {
        const name = typeof cert.name === 'string' ? cert.name.trim() : '';
        if (!name) return null;
        return {
          name,
          issuer: typeof cert.issuer === 'string' ? cert.issuer.trim() : '',
          issue_date: typeof cert.issue_date === 'string' ? cert.issue_date.trim() : '',
          expiration_date: typeof cert.expiration_date === 'string' && cert.expiration_date.trim() ? cert.expiration_date.trim() : undefined,
          credential_id: typeof cert.credential_id === 'string' && cert.credential_id.trim() ? cert.credential_id.trim() : undefined,
        };
      }
      return null;
    })
    .filter((c) => c !== null);

  return {
    full_name,
    email,
    phone,
    target_roles,
    education,
    skills,
    projects,
    experience,
    certifications,
  };
}

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
      job_types: [],
      preferred_locations: [],
      expected_salary_currency: '',
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

// ==========================================
// TEST EXECUTION
// ==========================================

// Test 1: Valid Module 2 output mapping
console.log('--- Test 1: Valid Module 2 output mapping (Priya Menon) ---');
const priyaIntermediate = mapModule2OutputToParsedResumeInput(priyaParsed);
assert.strictEqual(priyaIntermediate.full_name, 'Priya Menon');
assert.strictEqual(priyaIntermediate.email, undefined);
assert.strictEqual(priyaIntermediate.phone, undefined);
assert.deepStrictEqual(priyaIntermediate.target_roles, [
  'Application Support Analyst',
  'Associate Software Engineer',
]);
assert.strictEqual(priyaIntermediate.education.length, 1);
assert.strictEqual(priyaIntermediate.education[0].degree, 'B.Tech');
assert.strictEqual(priyaIntermediate.education[0].field_of_study, 'Information Technology');
assert.strictEqual(priyaIntermediate.education[0].institution, '');
assert.strictEqual(priyaIntermediate.education[0].start_year, '');
assert.strictEqual(priyaIntermediate.education[0].end_year, '2026');
assert.strictEqual(priyaIntermediate.education[0].gpa, '7.4 / 10');

assert.strictEqual(priyaIntermediate.skills.length, 9);
assert.strictEqual(priyaIntermediate.skills[0].name, 'SQL');
assert.strictEqual(priyaIntermediate.skills[0].categoryHint, 'SQL');
assert.strictEqual(priyaIntermediate.skills[1].name, 'Java');
assert.strictEqual(priyaIntermediate.skills[1].categoryHint, 'COD');
assert.strictEqual(priyaIntermediate.skills[2].name, 'Linux');
assert.strictEqual(priyaIntermediate.skills[2].categoryHint, 'OS');
assert.strictEqual(priyaIntermediate.skills[3].name, 'Computer Networks');
assert.strictEqual(priyaIntermediate.skills[3].categoryHint, 'NETW');
assert.strictEqual(priyaIntermediate.skills[4].name, 'Excel');
assert.strictEqual(priyaIntermediate.skills[4].categoryHint, 'OTHER');
assert.strictEqual(priyaIntermediate.skills[5].name, 'Ticketing Tools');
assert.strictEqual(priyaIntermediate.skills[5].categoryHint, 'OTHER');
assert.strictEqual(priyaIntermediate.skills[6].name, 'MySQL');
assert.strictEqual(priyaIntermediate.skills[6].categoryHint, 'SQL');
assert.strictEqual(priyaIntermediate.skills[7].name, 'Troubleshooting and Escalations');
assert.strictEqual(priyaIntermediate.skills[7].categoryHint, 'OTHER');
assert.strictEqual(priyaIntermediate.skills[8].name, 'Coordination');
assert.strictEqual(priyaIntermediate.skills[8].categoryHint, 'COMM');

assert.strictEqual(priyaIntermediate.projects.length, 2);
assert.strictEqual(priyaIntermediate.projects[0].title, 'Student attendance tracker');
assert.deepStrictEqual(priyaIntermediate.projects[0].technologies, ['Java', 'MySQL']);
assert.strictEqual(priyaIntermediate.projects[1].title, 'Helpdesk simulation project');
assert.deepStrictEqual(priyaIntermediate.projects[1].technologies, ['Ticketing Tools']);

assert.strictEqual(priyaIntermediate.experience.length, 1);
assert.strictEqual(priyaIntermediate.experience[0].company, 'Local business');
assert.strictEqual(priyaIntermediate.experience[0].title, 'Summer intern, IT support desk');
assert.strictEqual(priyaIntermediate.experience[0].description, 'handled first-level troubleshooting and escalations');

assert.strictEqual(priyaIntermediate.certifications.length, 1);
assert.strictEqual(priyaIntermediate.certifications[0].name, 'Cisco Networking Basics (online course)');
assert.strictEqual(priyaIntermediate.certifications[0].issuer, '');
assert.strictEqual(priyaIntermediate.certifications[0].issue_date, '');

const priyaProfile = mapParsedResumeToCandidateProfile(priyaIntermediate);
assert.strictEqual(priyaProfile.personal_info.full_name, 'Priya Menon');
assert.strictEqual(priyaProfile.skills.length, 9);
assert.strictEqual(priyaProfile.education.length, 1);
assert.strictEqual(priyaProfile.projects.length, 2);
assert.strictEqual(priyaProfile.internships_and_experience.length, 1);
assert.strictEqual(priyaProfile.certifications.length, 1);
console.log('✓ Test 1 Passed: Valid Module 2 output mapping verified');

// Test 2: Missing and null fields
console.log('\n--- Test 2: Missing and null fields integrity ---');
assert.strictEqual(priyaProfile.personal_info.email, '', 'Missing email must remain blank');
assert.strictEqual(priyaProfile.personal_info.phone, '', 'Missing phone must remain blank');
assert.strictEqual(priyaProfile.personal_info.location, '', 'Missing location must remain blank');
assert.strictEqual(priyaProfile.personal_info.headline, '', 'Missing headline must remain blank');
assert.strictEqual(priyaProfile.personal_info.summary, '', 'Missing summary must remain blank');
assert.strictEqual(priyaProfile.personal_info.links.linkedin, '', 'Missing linkedin must remain blank');
assert.strictEqual(priyaProfile.personal_info.links.github, '', 'Missing github must remain blank');
assert.strictEqual(priyaProfile.education[0].institution, '', 'Null institution must remain blank');
assert.strictEqual(priyaProfile.education[0].start_year, '', 'Missing start_year must remain blank');
assert.strictEqual(priyaProfile.preferred_roles.expected_salary_currency, '', 'Salary currency must remain blank');
assert.strictEqual(priyaProfile.preferred_roles.notice_period_days, undefined, 'Notice period must remain undefined');
assert.deepStrictEqual(priyaProfile.preferred_roles.job_types, [], 'Job types must remain empty');
console.log('✓ Test 2 Passed: Missing and null fields remain strictly blank without fabrication');

// Test 3: Unsupported category codes
console.log('\n--- Test 3: Unsupported category codes fallback to OTHER ---');
const rawWithUnsupported = {
  skills: [
    { skill_name: 'Quantum Computing', category_code: 'QUANTUM' },
    { skill_name: 'Solidity', category_code: 'BLOCKCHAIN' },
    { skill_name: 'TypeScript', category_code: 'cod' }, // lowercase valid
    { skill_name: 'PostgreSQL', category_code: 'sql' }, // lowercase valid
    { skill_name: 'Unspecified', category_code: null },
  ],
};
const mappedUnsupported = mapModule2OutputToParsedResumeInput(rawWithUnsupported);
assert.strictEqual(mappedUnsupported.skills[0].categoryHint, 'OTHER');
assert.strictEqual(mappedUnsupported.skills[1].categoryHint, 'OTHER');
assert.strictEqual(mappedUnsupported.skills[2].categoryHint, 'COD');
assert.strictEqual(mappedUnsupported.skills[3].categoryHint, 'SQL');
assert.strictEqual(mappedUnsupported.skills[4].categoryHint, 'OTHER');
console.log('✓ Test 3 Passed: Unsupported category codes safely mapped to OTHER without guessing');

// Test 4: Missing skill evidence
console.log('\n--- Test 4: Missing skill evidence ---');
const rawWithoutEvidence = {
  skills: [
    { skill_name: 'Rust', category_code: 'COD', evidence: null, evidence_verified: true },
    { skill_name: 'Go', category_code: 'COD', evidence: '', evidence_verified: false },
    { skill_name: 'Docker', category_code: 'CLOUD' },
  ],
};
const mappedNoEvidence = mapModule2OutputToParsedResumeInput(rawWithoutEvidence);
assert.strictEqual(mappedNoEvidence.skills[0].evidenceHint, undefined);
assert.strictEqual(mappedNoEvidence.skills[1].evidenceHint, undefined);
assert.strictEqual(mappedNoEvidence.skills[2].evidenceHint, undefined);

const profileNoEvidence = mapParsedResumeToCandidateProfile(mappedNoEvidence);
assert.strictEqual(profileNoEvidence.skills[0].evidence, '');
assert.strictEqual(profileNoEvidence.skills[1].evidence, '');
assert.strictEqual(profileNoEvidence.skills[2].evidence, '');
console.log('✓ Test 4 Passed: Missing skill evidence remains empty string without fabricated text');

// Test 5: Malformed JSON and invalid types
console.log('\n--- Test 5: Malformed JSON and invalid types ---');
const nonObjects = [null, undefined, 1234, 'invalid-string', true, []];
for (const bad of nonObjects) {
  const result = mapModule2OutputToParsedResumeInput(bad);
  assert(result && typeof result === 'object');
  assert.deepStrictEqual(result.skills, []);
  assert.deepStrictEqual(result.education, []);
  assert.deepStrictEqual(result.projects, []);
}

const corruptedStructure = {
  schema_version: 123, // should be string
  source_type: false, // should be string
  skills: 'not-an-array',
  profile_prefill: 'not-an-object',
  details: 456,
};
const validation = validateModule2Output(corruptedStructure);
assert.strictEqual(validation.isValid, false);
assert(validation.errors.length >= 4);

// Adapter still does not throw on corrupted structure
const safeResult = mapModule2OutputToParsedResumeInput(corruptedStructure);
assert.deepStrictEqual(safeResult.skills, []);
assert.deepStrictEqual(safeResult.education, []);
console.log('✓ Test 5 Passed: Malformed JSON and invalid types safely handled without errors');

// Test 6: No cross-profile data leakage
console.log('\n--- Test 6: No cross-profile data leakage ---');
const priyaJSONString = JSON.stringify(priyaProfile);
assert.strictEqual(priyaJSONString.includes('Ananya'), false);
assert.strictEqual(priyaJSONString.includes('Jordan'), false);
assert.strictEqual(priyaJSONString.includes('Aether'), false);
assert.strictEqual(priyaJSONString.includes('Multithreaded Job Scheduler'), false);

const ananyaProfile = mapParsedResumeToCandidateProfile(ananyaParsed);
const ananyaJSONString = JSON.stringify(ananyaProfile);
assert.strictEqual(ananyaJSONString.includes('Priya'), false);
assert.strictEqual(ananyaJSONString.includes('attendance tracker'), false);
assert.strictEqual(ananyaJSONString.includes('Cisco Networking Basics'), false);
console.log('✓ Test 6 Passed: Zero cross-profile data leakage confirmed');

// Test 7: Merge mode preserving candidate edits
console.log('\n--- Test 7: Merge mode preserving candidate edits ---');
const candidateManualDraft = {
  ...priyaProfile,
  profile_id: 'draft-priya-persistent-id',
  personal_info: {
    ...priyaProfile.personal_info,
    full_name: 'Priya Menon',
    email: 'priya.menon@alumni.edu', // manually entered email
    phone: '+91 98765 43210', // manually entered phone
    location: 'Kochi, Kerala, India', // manually entered location
    headline: 'Information Technology Graduate & Support Desk Specialist',
    links: {
      ...priyaProfile.personal_info.links,
      linkedin: 'https://linkedin.com/in/priyamenon',
    },
  },
  preferred_roles: {
    ...priyaProfile.preferred_roles,
    notice_period_days: 15,
  },
};

const mergedResult = mergeResumeIntoCandidateProfile(candidateManualDraft, priyaIntermediate);
assert.strictEqual(mergedResult.profile_id, 'draft-priya-persistent-id');
assert.strictEqual(mergedResult.personal_info.email, 'priya.menon@alumni.edu', 'Explicit email must be preserved');
assert.strictEqual(mergedResult.personal_info.phone, '+91 98765 43210', 'Explicit phone must be preserved');
assert.strictEqual(mergedResult.personal_info.location, 'Kochi, Kerala, India', 'Explicit location must be preserved');
assert.strictEqual(
  mergedResult.personal_info.links.linkedin,
  'https://linkedin.com/in/priyamenon',
  'Explicit LinkedIn must be preserved'
);
assert.strictEqual(mergedResult.preferred_roles.notice_period_days, 15, 'Explicit notice period must be preserved');
assert.strictEqual(mergedResult.skills.length, 9, 'Skills from resume must be present');
assert.strictEqual(mergedResult.certifications.length, 1, 'Certifications from resume must be present');
console.log('✓ Test 7 Passed: Merge mode strictly preserves explicit candidate manual entries');

// Test 8: Canonical CandidateProfile schema compatibility
console.log('\n--- Test 8: Canonical CandidateProfile schema compatibility ---');
assert.strictEqual(priyaProfile.schema_version, '1.0.0');
const requiredKeys = [
  'schema_version',
  'profile_id',
  'last_updated',
  'personal_info',
  'preferred_roles',
  'education',
  'skills',
  'projects',
  'internships_and_experience',
  'certifications',
];
assert.deepStrictEqual(Object.keys(priyaProfile).sort(), requiredKeys.sort());

// Verify no unsupported metadata fields were attached to CandidateProfile
assert.strictEqual('source_section' in priyaProfile, false);
assert.strictEqual('parse_warnings' in priyaProfile, false);
assert.strictEqual('field_confidence' in priyaProfile, false);
assert.strictEqual('evidence_verified' in priyaProfile.skills[0], false);
assert.strictEqual('source_section' in priyaProfile.skills[0], false);
assert.strictEqual('hackathons' in priyaProfile, false);
assert.strictEqual('achievements' in priyaProfile, false);
console.log('✓ Test 8 Passed: Conforms strictly to canonical CandidateProfile v1.0.0 contract');

// Test 9: Existing Ananya fixture still mapping correctly
console.log('\n--- Test 9: Existing Ananya fixture still mapping correctly ---');
assert.strictEqual(ananyaProfile.personal_info.full_name, 'Ananya Rao');
assert.strictEqual(ananyaProfile.skills.length, 9);
assert.strictEqual(ananyaProfile.projects.length, 3);
assert.strictEqual(ananyaProfile.internships_and_experience.length, 2);
assert.strictEqual(ananyaProfile.education.length, 1);
assert.strictEqual(ananyaProfile.certifications.length, 0);
assert.strictEqual(ananyaProfile.personal_info.email, '');
assert.strictEqual(ananyaProfile.personal_info.phone, '');
assert.strictEqual(ananyaProfile.education[0].institution, '');
console.log('✓ Test 9 Passed: Ananya Rao fixture remains completely intact and verified');

// Test 10: Metadata extraction and isolation (including hackathons and achievements)
console.log('\n--- Test 10: Metadata extraction and isolation ---');
const metadata = extractModule2Metadata(priyaParsed);
assert(metadata !== null);
assert.deepStrictEqual(metadata.parse_warnings, ['No email or phone listed in resume']);
assert.strictEqual(metadata.field_confidence.email, 'none');
assert.strictEqual(metadata.field_confidence.name, 'high');
assert.strictEqual(metadata.skill_metadata.length, 9);
assert.strictEqual(metadata.skill_metadata[0].source_section, 'technical_skills');
assert.strictEqual(metadata.skill_metadata[0].evidence_verified, true);
assert.strictEqual(metadata.skill_metadata[6].source_section, 'projects');
assert.strictEqual(metadata.skill_metadata[7].source_section, 'internships');
assert.strictEqual(metadata.skill_metadata[8].source_section, 'achievements');
assert.strictEqual(metadata.hackathons.length, 1);
assert.strictEqual(metadata.hackathons[0].title, '12-hour campus hackathon');
assert.deepStrictEqual(metadata.achievements, [
  'Volunteer coordinator for a college technical fest, coordinating logistics across teams',
]);
console.log('✓ Test 10 Passed: External metadata (warnings, confidence, hackathons, achievements) honestly isolated from CandidateProfile');

// Test 11: Profile isolation with Jordan Taylor active profile
console.log('\n--- Test 11: Profile isolation with Jordan Taylor active profile ---');
const jordanActiveDraft = {
  schema_version: '1.0.0',
  profile_id: 'jordan-active-id-1234',
  last_updated: '2026-10-25T10:00:00.000Z',
  personal_info: {
    full_name: 'Jordan Taylor',
    email: 'jordan.taylor@example.org',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    headline: 'Senior Cloud Infrastructure Engineer',
    summary: 'DevOps and cloud infrastructure specialist.',
    links: {
      linkedin: 'https://linkedin.com/in/jordantaylor-cloud',
      github: 'https://github.com/jordantaylor-cloud',
      portfolio: 'https://jordantaylor.dev',
      other: '',
    },
  },
  preferred_roles: {
    target_roles: ['DevOps Engineer'],
    job_types: ['full-time'],
    preferred_locations: ['Austin, TX'],
    expected_salary_currency: 'USD',
    expected_salary_range: '150k - 180k',
    notice_period_days: 30,
  },
  education: [],
  skills: [],
  projects: [],
  internships_and_experience: [],
  certifications: [],
};

// 11a: Replace mode with Jordan active must NOT inherit any Jordan data
const replaceResult = mapParsedResumeToCandidateProfile(priyaIntermediate, jordanActiveDraft);
assert.strictEqual(replaceResult.profile_id, 'jordan-active-id-1234');
assert.strictEqual(replaceResult.personal_info.full_name, 'Priya Menon');
assert.strictEqual(replaceResult.personal_info.email, '', 'Replace mode must NOT inherit active email');
assert.strictEqual(replaceResult.personal_info.phone, '', 'Replace mode must NOT inherit active phone');
assert.strictEqual(replaceResult.personal_info.location, '', 'Replace mode must NOT inherit active location');
assert.strictEqual(replaceResult.personal_info.headline, '', 'Replace mode must NOT inherit active headline');
assert.deepStrictEqual(replaceResult.preferred_roles.job_types, []);
assert.strictEqual(replaceResult.preferred_roles.expected_salary_currency, '');

// 11b: Merge mode with Jordan active DOES preserve candidate-entered fields where resume is blank
const mergeWithJordan = mergeResumeIntoCandidateProfile(jordanActiveDraft, priyaIntermediate);
assert.strictEqual(mergeWithJordan.profile_id, 'jordan-active-id-1234');
assert.strictEqual(mergeWithJordan.personal_info.full_name, 'Priya Menon');
assert.strictEqual(mergeWithJordan.personal_info.email, 'jordan.taylor@example.org');
assert.strictEqual(mergeWithJordan.personal_info.phone, '+1 (555) 345-6789');
assert.strictEqual(mergeWithJordan.personal_info.location, 'Austin, TX');
assert.strictEqual(mergeWithJordan.skills.length, 9, 'Priya skills merged');
console.log('✓ Test 11 Passed: Profile isolation verified across both replace and merge modes');

// Test 12: Extreme malformed nested structures and null elements in arrays
console.log('\n--- Test 12: Extreme malformed nested structures resilience ---');
const extremeMalformed = {
  schema_version: '1.0',
  source_type: 'resume',
  skills: [
    null,
    undefined,
    'not-an-object',
    { skill_name: '', category_code: null },
    { skill_name: 'Python', category_code: 999, evidence: false, confidence: {} },
  ],
  profile_prefill: {
    name: null,
    email: 12345, // invalid type
    preferred_roles: ['Valid Role', null, undefined, 42],
    certifications: [null, undefined, 123, '', 'Valid Cert String', { name: '', issuer: null }],
  },
  details: {
    phone: {},
    education_details: [
      null,
      'invalid',
      { degree: null, field: 456, graduation_year: 'invalid-year' },
    ],
    projects: [null, { title: null, technologies: ['Valid Tech', null, 99] }],
    experience: [null, { company: null, role: 'Intern', is_current: 'yes' }],
  },
};

const extremeMapped = mapModule2OutputToParsedResumeInput(extremeMalformed);
assert.strictEqual(extremeMapped.full_name, undefined);
assert.strictEqual(extremeMapped.email, undefined);
assert.strictEqual(extremeMapped.phone, undefined);
assert.deepStrictEqual(extremeMapped.target_roles, ['Valid Role']);
assert.strictEqual(extremeMapped.skills.length, 1);
assert.strictEqual(extremeMapped.skills[0].name, 'Python');
assert.strictEqual(extremeMapped.skills[0].categoryHint, 'OTHER');
assert.strictEqual(extremeMapped.certifications.length, 1);
assert.strictEqual(extremeMapped.certifications[0].name, 'Valid Cert String');
assert.strictEqual(extremeMapped.projects[0].technologies.length, 1);
assert.strictEqual(extremeMapped.projects[0].technologies[0], 'Valid Tech');
console.log('✓ Test 12 Passed: Extreme malformed nested inputs handled gracefully without throwing');

console.log('\n================================================================');
console.log('All 12 Module 2 & Priya Menon Integration Tests Passed!');
console.log('================================================================\n');
