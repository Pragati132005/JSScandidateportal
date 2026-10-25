import type {
  CandidateProfile,
  CandidatePersonalInfo,
  CandidateEducation,
  CandidateSkill,
  CandidateProject,
  CandidateExperience,
  CandidateCertification,
} from '../types';

export interface ValidationErrorMap {
  [field: string]: string;
}

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return true; // Optional URLs can be empty
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
};

export const getSafeUrl = (url?: string): string | undefined => {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return undefined;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const validatePersonalInfo = (info: CandidatePersonalInfo): ValidationErrorMap => {
  const errors: ValidationErrorMap = {};

  if (!info.full_name.trim()) {
    errors.full_name = 'Full name is required';
  } else if (info.full_name.trim().length < 2) {
    errors.full_name = 'Name must be at least 2 characters';
  }

  if (!info.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(info.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!info.phone.trim()) {
    errors.phone = 'Phone number is required';
  }

  if (!info.location.trim()) {
    errors.location = 'Location is required';
  }

  if (!info.headline.trim()) {
    errors.headline = 'Professional headline is required';
  }

  if (info.links.linkedin && !isValidUrl(info.links.linkedin)) {
    errors.linkedin = 'Invalid LinkedIn URL format';
  }

  if (info.links.github && !isValidUrl(info.links.github)) {
    errors.github = 'Invalid GitHub URL format';
  }

  if (info.links.portfolio && !isValidUrl(info.links.portfolio)) {
    errors.portfolio = 'Invalid Portfolio URL format';
  }

  return errors;
};

export const validateEducation = (edu: CandidateEducation): ValidationErrorMap => {
  const errors: ValidationErrorMap = {};
  if (!edu.institution.trim()) errors.institution = 'Institution name is required';
  if (!edu.degree.trim()) errors.degree = 'Degree is required';
  if (!edu.field_of_study.trim()) errors.field_of_study = 'Field of study is required';
  if (!edu.start_year.trim()) errors.start_year = 'Start year is required';
  if (!edu.end_year.trim()) errors.end_year = 'End year is required';
  return errors;
};

export const validateSkill = (skill: CandidateSkill): ValidationErrorMap => {
  const errors: ValidationErrorMap = {};
  if (!skill.skill_name.trim()) errors.skill_name = 'Skill name is required';
  if (!skill.category_code) errors.category_code = 'RADIX category code is required';
  if (!skill.confidence) errors.confidence = 'Confidence level is required';
  if (!skill.evidence.trim()) {
    errors.evidence = 'Evidence or proof link is required for Talent Check verification';
  }
  return errors;
};

export const validateProject = (project: CandidateProject): ValidationErrorMap => {
  const errors: ValidationErrorMap = {};
  if (!project.title.trim()) errors.title = 'Project title is required';
  if (!project.role.trim()) errors.role = 'Role is required';
  if (!project.description.trim()) errors.description = 'Description is required';
  if (project.technologies.length === 0) errors.technologies = 'At least one technology is required';
  if (project.live_url && !isValidUrl(project.live_url)) errors.live_url = 'Invalid URL format';
  if (project.repo_url && !isValidUrl(project.repo_url)) errors.repo_url = 'Invalid repository URL format';
  return errors;
};

export const validateExperience = (exp: CandidateExperience): ValidationErrorMap => {
  const errors: ValidationErrorMap = {};
  if (!exp.company.trim()) errors.company = 'Company name is required';
  if (!exp.title.trim()) errors.title = 'Job title is required';
  if (!exp.location.trim()) errors.location = 'Location is required';
  if (!exp.start_date.trim()) errors.start_date = 'Start date is required';
  if (!exp.is_current && !exp.end_date.trim()) {
    errors.end_date = 'End date is required for past roles';
  }
  return errors;
};

export const validateCertification = (cert: CandidateCertification): ValidationErrorMap => {
  const errors: ValidationErrorMap = {};
  if (!cert.name.trim()) errors.name = 'Certification name is required';
  if (!cert.issuer.trim()) errors.issuer = 'Issuing organization is required';
  if (!cert.issue_date.trim()) errors.issue_date = 'Issue date is required';
  if (cert.credential_url && !isValidUrl(cert.credential_url)) {
    errors.credential_url = 'Invalid credential URL format';
  }
  return errors;
};

export const validateFullProfile = (profile: CandidateProfile): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const personalErrors = validatePersonalInfo(profile.personal_info);
  Object.values(personalErrors).forEach((err) => errors.push(`Personal: ${err}`));

  if (profile.skills.length === 0) {
    errors.push('Skills: Add at least one RADIX skill');
  }

  profile.skills.forEach((s, idx) => {
    const sErr = validateSkill(s);
    if (Object.keys(sErr).length > 0) {
      errors.push(`Skill #${idx + 1} (${s.skill_name || 'Unnamed'}): Missing required fields`);
    }
  });

  profile.education.forEach((e, idx) => {
    const eErr = validateEducation(e);
    if (Object.keys(eErr).length > 0) {
      errors.push(`Education #${idx + 1}: Missing required fields`);
    }
  });

  profile.projects.forEach((p, idx) => {
    const pErr = validateProject(p);
    if (Object.keys(pErr).length > 0) {
      errors.push(`Project #${idx + 1} (${p.title || 'Untitled'}): Missing required fields`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
