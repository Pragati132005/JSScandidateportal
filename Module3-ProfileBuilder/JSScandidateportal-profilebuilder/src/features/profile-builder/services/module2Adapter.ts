import type {
  Module2ParserOutput,
  Module2Metadata,
} from '../types/module2';
import type {
  ParsedResumeInput,
  ParsedResumeSkillInput,
} from './resumeAdapter';
import {
  normalizeRadixCategory,
  normalizeSkillConfidence,
} from './categoryNormalizer';

/**
 * Validates untrusted input to verify if it can be safely processed as Module 2 output.
 * Checks structure, types, and reports detailed validation errors without throwing.
 */
export const validateModule2Output = (
  raw: unknown
): { isValid: boolean; errors: string[]; parsed?: Module2ParserOutput } => {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      isValid: false,
      errors: ['Input must be a valid non-null JSON object.'],
    };
  }

  const obj = raw as Record<string, unknown>;

  if ('schema_version' in obj && obj.schema_version !== null && typeof obj.schema_version !== 'string') {
    errors.push("'schema_version' must be a string or null.");
  }

  if ('source_type' in obj && obj.source_type !== null && typeof obj.source_type !== 'string') {
    errors.push("'source_type' must be a string or null.");
  }

  if ('skills' in obj && obj.skills !== null && !Array.isArray(obj.skills)) {
    errors.push("'skills' must be an array.");
  } else if (Array.isArray(obj.skills)) {
    obj.skills.forEach((sk, idx) => {
      if (sk !== null && typeof sk !== 'object') {
        errors.push(`Skill at index ${idx} must be an object or null.`);
      }
    });
  }

  if ('profile_prefill' in obj && obj.profile_prefill !== null && typeof obj.profile_prefill !== 'object') {
    errors.push("'profile_prefill' must be an object or null.");
  } else if (typeof obj.profile_prefill === 'object' && obj.profile_prefill !== null) {
    const prefill = obj.profile_prefill as Record<string, unknown>;
    if ('preferred_roles' in prefill && prefill.preferred_roles !== null && !Array.isArray(prefill.preferred_roles)) {
      errors.push("'profile_prefill.preferred_roles' must be an array or null.");
    }
    if ('certifications' in prefill && prefill.certifications !== null && !Array.isArray(prefill.certifications)) {
      errors.push("'profile_prefill.certifications' must be an array or null.");
    }
  }

  if ('details' in obj && obj.details !== null && typeof obj.details !== 'object') {
    errors.push("'details' must be an object or null.");
  } else if (typeof obj.details === 'object' && obj.details !== null) {
    const details = obj.details as Record<string, unknown>;
    if ('education_details' in details && details.education_details !== null && !Array.isArray(details.education_details)) {
      errors.push("'details.education_details' must be an array or null.");
    }
    if ('projects' in details && details.projects !== null && !Array.isArray(details.projects)) {
      errors.push("'details.projects' must be an array or null.");
    }
    if ('experience' in details && details.experience !== null && !Array.isArray(details.experience)) {
      errors.push("'details.experience' must be an array or null.");
    }
  }

  if ('meta' in obj && obj.meta !== null && typeof obj.meta !== 'object') {
    errors.push("'meta' must be an object or null.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? (raw as Module2ParserOutput) : undefined,
  };
};

/**
 * Type guard to check if an unknown parsed object is in Module 2 format.
 */
export const isModule2ParserOutput = (raw: unknown): raw is Module2ParserOutput => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return false;
  }
  const obj = raw as Record<string, unknown>;
  return (
    'profile_prefill' in obj ||
    'details' in obj ||
    (typeof obj.source_type === 'string' && obj.source_type === 'resume') ||
    (Array.isArray(obj.skills) && obj.skills.some((s) => s && typeof s === 'object' && 'skill_name' in s))
  );
};

/**
 * Extracts external metadata (provenance, parse warnings, field confidences, source sections)
 * into a standalone structure separate from the canonical CandidateProfile.
 */
export const extractModule2Metadata = (raw: unknown): Module2Metadata | null => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const rawObj = raw as Record<string, unknown>;
  const metaObj = (typeof rawObj.meta === 'object' && rawObj.meta !== null ? rawObj.meta : {}) as Record<string, unknown>;

  const parseWarnings = Array.isArray(metaObj.parse_warnings)
    ? metaObj.parse_warnings.filter((w): w is string => typeof w === 'string')
    : undefined;

  const categoriesWithoutEvidence = Array.isArray(metaObj.categories_without_evidence)
    ? metaObj.categories_without_evidence.filter((c): c is string => typeof c === 'string')
    : undefined;

  const fieldConfidence =
    typeof metaObj.field_confidence === 'object' && metaObj.field_confidence !== null
      ? Object.fromEntries(
          Object.entries(metaObj.field_confidence as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'string')
            .map(([k, v]) => [k, String(v)])
        )
      : undefined;

  const rawSkills = Array.isArray(rawObj.skills)
    ? rawObj.skills
    : typeof rawObj.profile_prefill === 'object' && rawObj.profile_prefill !== null && Array.isArray((rawObj.profile_prefill as Record<string, unknown>).skills)
      ? ((rawObj.profile_prefill as Record<string, unknown>).skills as unknown[])
      : [];

  const skillMetadata = rawSkills
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      skill_name: typeof s.skill_name === 'string' ? s.skill_name.trim() : (typeof s.name === 'string' ? s.name.trim() : ''),
      source_section: typeof s.source_section === 'string' ? s.source_section.trim() : undefined,
      evidence_verified: typeof s.evidence_verified === 'boolean' ? s.evidence_verified : undefined,
      confidence: typeof s.confidence === 'string' ? s.confidence.trim() : undefined,
    }))
    .filter((sm) => sm.skill_name.length > 0);

  const rawPrefill =
    typeof rawObj.profile_prefill === 'object' && rawObj.profile_prefill !== null
      ? (rawObj.profile_prefill as Record<string, unknown>)
      : undefined;

  const rawDetails =
    typeof rawObj.details === 'object' && rawObj.details !== null
      ? (rawObj.details as Record<string, unknown>)
      : undefined;

  const hackathons = Array.isArray(rawPrefill?.hackathons)
    ? (rawPrefill.hackathons as Array<Record<string, unknown>>)
        .filter((h) => typeof h === 'object' && h !== null)
        .map((h) => ({
          title: typeof h.title === 'string' ? h.title.trim() : null,
          result: typeof h.result === 'string' ? h.result.trim() : null,
          kind: typeof h.kind === 'string' ? h.kind.trim() : null,
          description: typeof h.description === 'string' ? h.description.trim() : null,
        }))
    : undefined;

  const achievements = Array.isArray(rawDetails?.achievements)
    ? (rawDetails.achievements as unknown[])
        .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
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
};

/**
 * Pure adapter function mapping Module 2 Resume Parsing output into ParsedResumeInput.
 *
 * ZERO FABRICATION & PROVENANCE INTEGRITY:
 * - Missing contact info remains strictly undefined.
 * - Does not infer emails, phones, institutions, or dates.
 * - Normalizes category_code against the 13 approved RADIX codes (unsupported -> OTHER).
 * - Normalizes confidence levels without guessing.
 * - Never converts missing evidence into fabricated claims.
 */
export const mapModule2OutputToParsedResumeInput = (raw: unknown): ParsedResumeInput => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
    };
  }

  const rawObj = raw as Record<string, unknown>;
  const prefill =
    typeof rawObj.profile_prefill === 'object' && rawObj.profile_prefill !== null
      ? (rawObj.profile_prefill as Record<string, unknown>)
      : undefined;

  const details =
    typeof rawObj.details === 'object' && rawObj.details !== null
      ? (rawObj.details as Record<string, unknown>)
      : undefined;

  // 1. Contact info: profile_prefill.name -> full_name, profile_prefill.email -> email, details.phone -> phone
  const full_name =
    typeof prefill?.name === 'string' && prefill.name.trim() ? prefill.name.trim() : undefined;
  const email =
    typeof prefill?.email === 'string' && prefill.email.trim() ? prefill.email.trim() : undefined;
  const phone =
    typeof details?.phone === 'string' && details.phone.trim() ? details.phone.trim() : undefined;

  // 2. Education: details.education_details -> education
  const rawEducation = Array.isArray(details?.education_details)
    ? details.education_details
    : [];

  const education: ParsedResumeInput['education'] = rawEducation
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((edu) => {
      const degree = typeof edu.degree === 'string' ? edu.degree.trim() : '';
      const field =
        typeof edu.field === 'string' && edu.field.trim()
          ? edu.field.trim()
          : typeof edu.field_of_study === 'string'
            ? edu.field_of_study.trim()
            : '';
      const institution = typeof edu.institution === 'string' ? edu.institution.trim() : '';

      const startYear =
        edu.start_year != null && String(edu.start_year).trim()
          ? String(edu.start_year).trim()
          : '';

      const endYear =
        edu.graduation_year != null && String(edu.graduation_year).trim()
          ? String(edu.graduation_year).trim()
          : edu.end_year != null && String(edu.end_year).trim()
            ? String(edu.end_year).trim()
            : '';

      const gpa =
        typeof edu.grade === 'string' && edu.grade.trim()
          ? edu.grade.trim()
          : typeof edu.gpa === 'string' && edu.gpa.trim()
            ? edu.gpa.trim()
            : undefined;

      return {
        institution,
        degree,
        field_of_study: field,
        start_year: startYear,
        end_year: endYear,
        gpa,
      };
    });

  // 3. Skills: skills -> skills (mapping skill_name -> name, category_code -> categoryHint, evidence -> evidenceHint)
  const rawSkills = Array.isArray(rawObj.skills)
    ? rawObj.skills
    : Array.isArray(prefill?.skills)
      ? (prefill.skills as unknown[])
      : [];

  const skills: ParsedResumeSkillInput[] = rawSkills
    .filter((sk): sk is Record<string, unknown> => typeof sk === 'object' && sk !== null)
    .map((sk) => {
      const name =
        typeof sk.skill_name === 'string' && sk.skill_name.trim()
          ? sk.skill_name.trim()
          : typeof sk.name === 'string' && sk.name.trim()
            ? sk.name.trim()
            : '';

      const rawCategory =
        typeof sk.category_code === 'string'
          ? sk.category_code
          : typeof sk.categoryHint === 'string'
            ? sk.categoryHint
            : undefined;

      const rawEvidence =
        typeof sk.evidence === 'string' && sk.evidence.trim()
          ? sk.evidence.trim()
          : typeof sk.evidenceHint === 'string' && sk.evidenceHint.trim()
            ? sk.evidenceHint.trim()
            : undefined;

      const rawConfidence =
        typeof sk.confidence === 'string' ? sk.confidence.trim() : undefined;

      return {
        name,
        categoryHint: normalizeRadixCategory(rawCategory),
        evidenceHint: rawEvidence,
        confidence: normalizeSkillConfidence(rawConfidence),
      };
    })
    .filter((s) => s.name.length > 0);

  // 4. Projects: details.projects -> projects
  const rawProjects = Array.isArray(details?.projects) ? details.projects : [];
  const projects: ParsedResumeInput['projects'] = rawProjects
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((proj) => {
      const title = typeof proj.title === 'string' ? proj.title.trim() : '';
      const role = typeof proj.role === 'string' ? proj.role.trim() : '';
      const description = typeof proj.description === 'string' ? proj.description.trim() : '';
      const technologies = Array.isArray(proj.technologies)
        ? proj.technologies
            .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
            .map((t) => t.trim())
        : [];
      const live_url =
        typeof proj.live_url === 'string' && proj.live_url.trim() ? proj.live_url.trim() : undefined;
      const repo_url =
        typeof proj.repo_url === 'string' && proj.repo_url.trim() ? proj.repo_url.trim() : undefined;
      const start_date =
        typeof proj.start_date === 'string' && proj.start_date.trim()
          ? proj.start_date.trim()
          : undefined;
      const end_date =
        typeof proj.end_date === 'string' && proj.end_date.trim() ? proj.end_date.trim() : undefined;
      const highlights = Array.isArray(proj.highlights)
        ? proj.highlights
            .filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
            .map((h) => h.trim())
        : undefined;

      return {
        title,
        role,
        description,
        technologies,
        live_url,
        repo_url,
        start_date,
        end_date,
        highlights,
      };
    });

  // 5. Experience: details.experience -> experience (fallback to profile_prefill.internships)
  const rawExperience = Array.isArray(details?.experience)
    ? details.experience
    : Array.isArray(prefill?.internships)
      ? (prefill.internships as unknown[])
      : [];

  const experience: ParsedResumeInput['experience'] = rawExperience
    .filter((exp): exp is Record<string, unknown> => typeof exp === 'object' && exp !== null)
    .map((exp) => {
      const company =
        typeof exp.company === 'string' && exp.company.trim()
          ? exp.company.trim()
          : typeof exp.organization === 'string' && exp.organization.trim()
            ? exp.organization.trim()
            : '';

      const title =
        typeof exp.title === 'string' && exp.title.trim()
          ? exp.title.trim()
          : typeof exp.role === 'string' && exp.role.trim()
            ? exp.role.trim()
            : '';

      const location = typeof exp.location === 'string' ? exp.location.trim() : '';
      const start_date = typeof exp.start_date === 'string' ? exp.start_date.trim() : '';
      const end_date = typeof exp.end_date === 'string' ? exp.end_date.trim() : '';
      const is_current = Boolean(exp.is_current);
      const description = typeof exp.description === 'string' ? exp.description.trim() : '';
      const technologies = Array.isArray(exp.technologies)
        ? exp.technologies
            .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
            .map((t) => t.trim())
        : [];

      return {
        company,
        title,
        location,
        start_date,
        end_date,
        is_current,
        description,
        technologies,
      };
    });

  // 6. Target roles: profile_prefill.preferred_roles -> target_roles
  const target_roles = Array.isArray(prefill?.preferred_roles)
    ? prefill.preferred_roles
        .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
        .map((r) => r.trim())
    : undefined;

  // 7. Certifications: profile_prefill.certifications -> canonical parsed certification objects
  const rawCertifications = Array.isArray(prefill?.certifications) ? prefill.certifications : [];
  const certifications: ParsedResumeInput['certifications'] = rawCertifications
    .map((cert) => {
      if (typeof cert === 'string' && cert.trim().length > 0) {
        return {
          name: cert.trim(),
          issuer: '',
          issue_date: '',
        };
      }
      if (typeof cert === 'object' && cert !== null) {
        const cObj = cert as Record<string, unknown>;
        const name = typeof cObj.name === 'string' ? cObj.name.trim() : '';
        if (!name) return null;
        return {
          name,
          issuer: typeof cObj.issuer === 'string' ? cObj.issuer.trim() : '',
          issue_date: typeof cObj.issue_date === 'string' ? cObj.issue_date.trim() : '',
          expiration_date:
            typeof cObj.expiration_date === 'string' && cObj.expiration_date.trim()
              ? cObj.expiration_date.trim()
              : undefined,
          credential_id:
            typeof cObj.credential_id === 'string' && cObj.credential_id.trim()
              ? cObj.credential_id.trim()
              : undefined,
        };
      }
      return null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  // 8. Contact links from details.links if present
  let links: ParsedResumeInput['links'] = undefined;
  if (Array.isArray(details?.links)) {
    const rawLinks = details.links;
    let linkedin: string | undefined;
    let github: string | undefined;
    let portfolio: string | undefined;

    for (const item of rawLinks) {
      const urlStr =
        typeof item === 'string'
          ? item.trim()
          : typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).url === 'string'
            ? String((item as Record<string, unknown>).url).trim()
            : '';

      if (!urlStr) continue;
      const lower = urlStr.toLowerCase();
      if (lower.includes('linkedin.com')) linkedin = urlStr;
      else if (lower.includes('github.com')) github = urlStr;
      else if (!portfolio) portfolio = urlStr;
    }

    if (linkedin || github || portfolio) {
      links = { linkedin, github, portfolio };
    }
  }

  return {
    full_name,
    email,
    phone,
    links,
    target_roles,
    education,
    skills,
    projects,
    experience,
    certifications,
  };
};

/**
 * Authoritative Priya Menon Module 2 parsed JSON fixture.
 */
export const PRIYA_MENON_PARSED_OUTPUT: Module2ParserOutput = {
  schema_version: '1.0',
  source_type: 'resume',
  source_file: 'Priya_Menon.pdf',
  company: null,
  role: null,
  skills: [
    {
      skill_name: 'SQL',
      category_code: 'SQL',
      evidence: 'SQL (basic), Java, Linux basics, Networking fundamentals',
      confidence: 'high',
      evidence_verified: true,
      source_section: 'technical_skills',
    },
    {
      skill_name: 'Java',
      category_code: 'COD',
      evidence: 'SQL (basic), Java, Linux basics, Networking fundamentals',
      confidence: 'high',
      evidence_verified: true,
      source_section: 'technical_skills',
    },
    {
      skill_name: 'Linux',
      category_code: 'OS',
      evidence: 'SQL (basic), Java, Linux basics, Networking fundamentals',
      confidence: 'high',
      evidence_verified: true,
      source_section: 'technical_skills',
    },
    {
      skill_name: 'Computer Networks',
      category_code: 'NETW',
      evidence: 'Networking fundamentals, MS Excel, exposure to ticketing tools',
      confidence: 'high',
      evidence_verified: true,
      source_section: 'technical_skills',
    },
    {
      skill_name: 'Excel',
      category_code: 'OTHER',
      evidence: 'Networking fundamentals, MS Excel, exposure to ticketing tools',
      confidence: 'high',
      evidence_verified: true,
      source_section: 'technical_skills',
    },
    {
      skill_name: 'Ticketing Tools',
      category_code: 'OTHER',
      evidence: 'exposure to ticketing tools',
      confidence: 'high',
      evidence_verified: true,
      source_section: 'technical_skills',
    },
    {
      skill_name: 'MySQL',
      category_code: 'SQL',
      evidence:
        'Built a simple student attendance tracker using Java and a MySQL backend for a college project',
      confidence: 'medium',
      evidence_verified: true,
      source_section: 'projects',
    },
    {
      skill_name: 'Troubleshooting and Escalations',
      category_code: 'OTHER',
      evidence: 'handled first-level troubleshooting and escalations',
      confidence: 'medium',
      evidence_verified: true,
      source_section: 'internships',
    },
    {
      skill_name: 'Coordination',
      category_code: 'COMM',
      evidence:
        'Volunteer coordinator for a college technical fest, coordinating logistics across teams',
      confidence: 'low',
      evidence_verified: true,
      source_section: 'achievements',
    },
  ],
  profile_prefill: {
    name: 'Priya Menon',
    email: null,
    education: 'B.Tech, Information Technology, Class of 2026 — CGPA 7.4 / 10',
    skills: [
      {
        skill_name: 'SQL',
        category_code: 'SQL',
        evidence: 'SQL (basic), Java, Linux basics, Networking fundamentals',
        confidence: 'high',
        evidence_verified: true,
        source_section: 'technical_skills',
      },
      {
        skill_name: 'Java',
        category_code: 'COD',
        evidence: 'SQL (basic), Java, Linux basics, Networking fundamentals',
        confidence: 'high',
        evidence_verified: true,
        source_section: 'technical_skills',
      },
      {
        skill_name: 'Linux',
        category_code: 'OS',
        evidence: 'SQL (basic), Java, Linux basics, Networking fundamentals',
        confidence: 'high',
        evidence_verified: true,
        source_section: 'technical_skills',
      },
      {
        skill_name: 'Computer Networks',
        category_code: 'NETW',
        evidence: 'Networking fundamentals, MS Excel, exposure to ticketing tools',
        confidence: 'high',
        evidence_verified: true,
        source_section: 'technical_skills',
      },
      {
        skill_name: 'Excel',
        category_code: 'OTHER',
        evidence: 'Networking fundamentals, MS Excel, exposure to ticketing tools',
        confidence: 'high',
        evidence_verified: true,
        source_section: 'technical_skills',
      },
      {
        skill_name: 'Ticketing Tools',
        category_code: 'OTHER',
        evidence: 'exposure to ticketing tools',
        confidence: 'high',
        evidence_verified: true,
        source_section: 'technical_skills',
      },
      {
        skill_name: 'MySQL',
        category_code: 'SQL',
        evidence:
          'Built a simple student attendance tracker using Java and a MySQL backend for a college project',
        confidence: 'medium',
        evidence_verified: true,
        source_section: 'projects',
      },
      {
        skill_name: 'Troubleshooting and Escalations',
        category_code: 'OTHER',
        evidence: 'handled first-level troubleshooting and escalations',
        confidence: 'medium',
        evidence_verified: true,
        source_section: 'internships',
      },
      {
        skill_name: 'Coordination',
        category_code: 'COMM',
        evidence:
          'Volunteer coordinator for a college technical fest, coordinating logistics across teams',
        confidence: 'low',
        evidence_verified: true,
        source_section: 'achievements',
      },
    ],
    hackathons: [
      {
        title: '12-hour campus hackathon',
        result: 'Participated (non-finalist)',
        kind: 'hackathon',
        description: 'Participated in 12-hour campus hackathon',
      },
    ],
    internships: [
      {
        role: 'Summer intern, IT support desk',
        organization: 'Local business',
        description: 'handled first-level troubleshooting and escalations',
      },
    ],
    certifications: ['Cisco Networking Basics (online course)'],
    preferred_roles: ['Application Support Analyst', 'Associate Software Engineer'],
    cv_file: 'Priya_Menon.pdf',
  },
  details: {
    phone: null,
    links: [],
    education_details: [
      {
        degree: 'B.Tech',
        field: 'Information Technology',
        institution: null,
        graduation_year: 2026,
        grade: '7.4 / 10',
        grade_scale: 'CGPA',
      },
    ],
    projects: [
      {
        title: 'Student attendance tracker',
        description:
          'Built a simple student attendance tracker using Java and a MySQL backend for a college project',
        technologies: ['Java', 'MySQL'],
      },
      {
        title: 'Helpdesk simulation project',
        description:
          'Contributed to a college helpdesk simulation project, resolving simulated tickets and logging resolutions',
        technologies: ['Ticketing Tools'],
      },
    ],
    experience: [
      {
        role: 'Summer intern, IT support desk',
        organization: 'Local business',
        description: 'handled first-level troubleshooting and escalations',
      },
    ],
    achievements: [
      'Volunteer coordinator for a college technical fest, coordinating logistics across teams',
    ],
  },
  category_summary: null,
  meta: {
    parser_version: '1.0',
    prompt_version: 'p1',
    taxonomy_version: 'v1',
    model_used: 'manual-fixture',
    from_cache: false,
    input_format: 'pdf',
    parse_warnings: ['No email or phone listed in resume'],
    categories_without_evidence: ['DSA', 'OOD', 'AI', 'CLOUD', 'SYSD', 'APTI'],
    field_confidence: {
      name: 'high',
      email: 'none',
      education: 'high',
      skills: 'high',
    },
    processing_ms: 0,
  },
};

/**
 * Mapped ParsedResumeInput representation of Priya Menon.
 */
export const PRIYA_MENON_PARSED_RESUME: ParsedResumeInput = mapModule2OutputToParsedResumeInput(
  PRIYA_MENON_PARSED_OUTPUT
);
