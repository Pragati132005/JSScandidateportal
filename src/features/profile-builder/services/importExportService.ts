import type {
  CandidateProfile,
  CandidateSkill,
  RadixCategoryCode,
  SkillConfidence,
} from '../types';
import { RADIX_CATEGORY_CODES, SKILL_CONFIDENCE_LEVELS } from '../types';
import { validateFullProfile } from '../schemas';

export interface ImportValidationResult {
  isValid: boolean;
  profile?: CandidateProfile;
  errors: string[];
  schemaVersion?: string;
  isVersionMismatch?: boolean;
}

export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Generates a filesystem-safe filename for a candidate profile export.
 */
export const generateSafeFilename = (profile: CandidateProfile): string => {
  const name = profile.personal_info.full_name.trim();
  const rawBase = name ? name.toLowerCase() : profile.profile_id;
  const sanitized = rawBase
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

  const dateStr = new Date().toISOString().split('T')[0];
  return `radix_profile_${sanitized || 'candidate'}_${dateStr}.json`;
};

/**
 * Triggers a browser download of a clean, formatted CandidateProfile JSON file.
 * Returns true if successful, or throws/returns false.
 */
export const exportProfileToJsonFile = (
  profile: CandidateProfile
): { success: boolean; filename: string; error?: string } => {
  if (typeof window === 'undefined' || !window.Blob) {
    return { success: false, filename: '', error: 'Browser File API is unavailable.' };
  }

  try {
    // Canonical data representation only (no local UI or storage metadata)
    const exportData: CandidateProfile = {
      schema_version: '1.0.0',
      profile_id: profile.profile_id,
      last_updated: profile.last_updated || new Date().toISOString(),
      personal_info: {
        full_name: profile.personal_info.full_name,
        email: profile.personal_info.email,
        phone: profile.personal_info.phone,
        location: profile.personal_info.location,
        headline: profile.personal_info.headline,
        summary: profile.personal_info.summary,
        links: {
          linkedin: profile.personal_info.links?.linkedin || '',
          github: profile.personal_info.links?.github || '',
          portfolio: profile.personal_info.links?.portfolio || '',
          other: profile.personal_info.links?.other || '',
        },
      },
      preferred_roles: {
        target_roles: Array.isArray(profile.preferred_roles?.target_roles)
          ? [...profile.preferred_roles.target_roles]
          : [],
        job_types: Array.isArray(profile.preferred_roles?.job_types)
          ? [...profile.preferred_roles.job_types]
          : [],
        preferred_locations: Array.isArray(profile.preferred_roles?.preferred_locations)
          ? [...profile.preferred_roles.preferred_locations]
          : [],
        expected_salary_currency: profile.preferred_roles?.expected_salary_currency || 'USD',
        expected_salary_range: profile.preferred_roles?.expected_salary_range || '',
        notice_period_days: profile.preferred_roles?.notice_period_days,
      },
      education: (profile.education || []).map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        field_of_study: e.field_of_study,
        start_year: e.start_year,
        end_year: e.end_year,
        gpa_or_grade: e.gpa_or_grade || '',
        highlights: e.highlights || '',
      })),
      skills: (profile.skills || []).map((s) => ({
        id: s.id,
        skill_name: s.skill_name,
        category_code: s.category_code,
        evidence: s.evidence,
        confidence: s.confidence,
      })),
      projects: (profile.projects || []).map((p) => ({
        id: p.id,
        title: p.title,
        role: p.role,
        description: p.description,
        technologies: [...(p.technologies || [])],
        live_url: p.live_url || '',
        repo_url: p.repo_url || '',
        start_date: p.start_date || '',
        end_date: p.end_date || '',
        highlights: [...(p.highlights || [])],
      })),
      internships_and_experience: (profile.internships_and_experience || []).map((exp) => ({
        id: exp.id,
        company: exp.company,
        title: exp.title,
        location: exp.location,
        start_date: exp.start_date,
        end_date: exp.end_date || '',
        is_current: exp.is_current,
        description: exp.description || '',
        technologies: [...(exp.technologies || [])],
      })),
      certifications: (profile.certifications || []).map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        issue_date: c.issue_date,
        expiration_date: c.expiration_date || '',
        credential_id: c.credential_id || '',
        credential_url: c.credential_url || '',
      })),
    };

    const jsonText = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const filename = generateSafeFilename(exportData);

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up temporary object URL
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 100);

    return { success: true, filename };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown export error';
    return { success: false, filename: '', error: message };
  }
};

/**
 * Validates raw imported JSON against the canonical CandidateProfile contract.
 * Strictly verifies schema version, structure, RADIX category codes, and confidence levels.
 */
export const validateImportedCandidateJson = (rawText: string): ImportValidationResult => {
  const errors: string[] = [];

  if (!rawText || !rawText.trim()) {
    return { isValid: false, errors: ['File is empty. Please select a valid JSON profile file.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : 'Invalid JSON syntax';
    return { isValid: false, errors: [`JSON Parse Error: ${msg}. Check file formatting.`] };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, errors: ['Invalid format: Root must be a Candidate Profile JSON object.'] };
  }

  const obj = parsed as Record<string, unknown>;

  // 1. Schema version check
  const schemaVersion = typeof obj.schema_version === 'string' ? obj.schema_version : undefined;
  if (!schemaVersion) {
    errors.push('Missing required property: "schema_version". Expected "1.0.0".');
  } else if (schemaVersion !== '1.0.0') {
    return {
      isValid: false,
      schemaVersion,
      isVersionMismatch: true,
      errors: [
        `Unsupported schema version "${schemaVersion}". Profile Builder currently requires RADIX Contract version "1.0.0".`,
      ],
    };
  }

  // 2. Profile ID check
  if (!obj.profile_id || typeof obj.profile_id !== 'string') {
    errors.push('Missing or invalid "profile_id". Must be a non-empty string identifier.');
  }

  // 3. Personal info check
  if (!obj.personal_info || typeof obj.personal_info !== 'object' || Array.isArray(obj.personal_info)) {
    errors.push('Missing required object: "personal_info".');
  } else {
    const pInfo = obj.personal_info as Record<string, unknown>;
    if (!pInfo.full_name || typeof pInfo.full_name !== 'string' || !pInfo.full_name.trim()) {
      errors.push('Personal Info: "full_name" is required.');
    }
    if (!pInfo.email || typeof pInfo.email !== 'string' || !pInfo.email.trim()) {
      errors.push('Personal Info: "email" is required.');
    }
    if (!pInfo.phone || typeof pInfo.phone !== 'string') {
      errors.push('Personal Info: "phone" is required.');
    }
    if (!pInfo.location || typeof pInfo.location !== 'string') {
      errors.push('Personal Info: "location" is required.');
    }
    if (!pInfo.headline || typeof pInfo.headline !== 'string') {
      errors.push('Personal Info: "headline" is required.');
    }
  }

  // 4. Skills validation (Must have valid RADIX codes and confidence)
  if (!Array.isArray(obj.skills)) {
    errors.push('Missing required array: "skills".');
  } else {
    if (obj.skills.length === 0) {
      errors.push('Skills: Candidate profile must contain at least one skill.');
    }

    obj.skills.forEach((skillItem: unknown, idx: number) => {
      if (!skillItem || typeof skillItem !== 'object') {
        errors.push(`Skill #${idx + 1}: Must be an object.`);
        return;
      }
      const s = skillItem as Partial<CandidateSkill>;
      if (!s.skill_name || typeof s.skill_name !== 'string' || !s.skill_name.trim()) {
        errors.push(`Skill #${idx + 1}: "skill_name" is required.`);
      }

      // Exact RADIX category validation
      if (!s.category_code || typeof s.category_code !== 'string') {
        errors.push(`Skill #${idx + 1} (${s.skill_name || 'unnamed'}): "category_code" is required.`);
      } else if (!RADIX_CATEGORY_CODES.includes(s.category_code as RadixCategoryCode)) {
        errors.push(
          `Skill #${idx + 1} (${s.skill_name || 'unnamed'}): Invalid RADIX category "${s.category_code}". Must be one of: ${RADIX_CATEGORY_CODES.join(', ')}.`
        );
      }

      // Exact confidence validation
      if (!s.confidence || typeof s.confidence !== 'string') {
        errors.push(`Skill #${idx + 1} (${s.skill_name || 'unnamed'}): "confidence" is required.`);
      } else if (!SKILL_CONFIDENCE_LEVELS.includes(s.confidence as SkillConfidence)) {
        errors.push(
          `Skill #${idx + 1} (${s.skill_name || 'unnamed'}): Invalid confidence "${s.confidence}". Must be "high", "medium", or "low".`
        );
      }

      if (!s.evidence || typeof s.evidence !== 'string' || !s.evidence.trim()) {
        errors.push(`Skill #${idx + 1} (${s.skill_name || 'unnamed'}): "evidence" or proof is required for Talent Check.`);
      }
    });
  }

  // 5. Array checks for optional collections
  if (obj.education !== undefined && !Array.isArray(obj.education)) {
    errors.push('"education" must be an array.');
  }
  if (obj.projects !== undefined && !Array.isArray(obj.projects)) {
    errors.push('"projects" must be an array.');
  }
  if (obj.internships_and_experience !== undefined && !Array.isArray(obj.internships_and_experience)) {
    errors.push('"internships_and_experience" must be an array.');
  }
  if (obj.certifications !== undefined && !Array.isArray(obj.certifications)) {
    errors.push('"certifications" must be an array.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, schemaVersion };
  }

  // Cast and run semantic domain validation
  const candidate = obj as unknown as CandidateProfile;
  const fullValidation = validateFullProfile(candidate);
  if (!fullValidation.isValid) {
    return {
      isValid: false,
      errors: fullValidation.errors,
      schemaVersion,
    };
  }

  return {
    isValid: true,
    profile: candidate,
    errors: [],
    schemaVersion,
  };
};
