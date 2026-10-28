import type { CandidateProfile } from '../types';

export interface SectionCompletionStatus {
  id: string;
  name: string;
  percentage: number;
  isComplete: boolean;
  missingItems: string[];
}

export interface ProfileCompletionReport {
  overallScore: number;
  sections: Record<string, SectionCompletionStatus>;
  nextSteps: string[];
}

export const calculateProfileCompletion = (profile: CandidateProfile): ProfileCompletionReport => {
  const sections: Record<string, SectionCompletionStatus> = {};
  const nextSteps: string[] = [];

  // 1. Personal Information (30%)
  const personalMissing: string[] = [];
  let personalScore = 0;
  if (profile.personal_info.full_name.trim()) personalScore += 8;
  else personalMissing.push('Full Name');

  if (profile.personal_info.email.trim()) personalScore += 8;
  else personalMissing.push('Email Address');

  if (profile.personal_info.phone.trim()) personalScore += 4;
  else personalMissing.push('Phone Number');

  if (profile.personal_info.location.trim()) personalScore += 5;
  else personalMissing.push('Location');

  if (profile.personal_info.headline.trim()) personalScore += 5;
  else personalMissing.push('Professional Headline');

  sections.personal = {
    id: 'personal',
    name: 'Personal Information',
    percentage: personalScore,
    isComplete: personalMissing.length === 0,
    missingItems: personalMissing,
  };
  if (personalMissing.length > 0) {
    nextSteps.push(`Add ${personalMissing.join(', ')} in Personal Info`);
  }

  // 2. Summary (10%)
  const summaryMissing: string[] = [];
  let summaryScore = 0;
  if (profile.personal_info.summary.trim().length > 30) {
    summaryScore = 10;
  } else {
    summaryMissing.push('Professional Summary (min 30 characters)');
    nextSteps.push('Write a professional summary describing your core background');
  }
  sections.summary = {
    id: 'summary',
    name: 'Summary',
    percentage: summaryScore,
    isComplete: summaryMissing.length === 0,
    missingItems: summaryMissing,
  };

  // 3. Preferred Roles (10%)
  const rolesMissing: string[] = [];
  let rolesScore = 0;
  if (profile.preferred_roles.target_roles.length > 0) rolesScore += 5;
  else rolesMissing.push('At least one Target Role');

  if (profile.preferred_roles.job_types.length > 0) rolesScore += 5;
  else rolesMissing.push('Job Type Preference');

  sections.preferred_roles = {
    id: 'preferred_roles',
    name: 'Preferred Roles',
    percentage: rolesScore,
    isComplete: rolesMissing.length === 0,
    missingItems: rolesMissing,
  };
  if (rolesMissing.length > 0) {
    nextSteps.push(`Select ${rolesMissing.join(' and ')}`);
  }

  // 4. Education (10%)
  const eduMissing: string[] = [];
  let eduScore = 0;
  if (profile.education.length > 0) {
    const hasValid = profile.education.some(
      (e) => e.institution.trim() && e.degree.trim()
    );
    if (hasValid) eduScore = 10;
  } else {
    eduMissing.push('At least one Education record');
    nextSteps.push('Add your academic background or degree');
  }
  sections.education = {
    id: 'education',
    name: 'Education',
    percentage: eduScore,
    isComplete: eduMissing.length === 0,
    missingItems: eduMissing,
  };

  // 5. Skills (20%)
  const skillsMissing: string[] = [];
  let skillsScore = 0;
  if (profile.skills.length >= 1) {
    skillsScore += 8;
  } else {
    skillsMissing.push('At least one Skill');
  }

  const skillsWithEvidence = profile.skills.filter((s) => s.evidence.trim().length > 10);
  if (profile.skills.length >= 3 && skillsWithEvidence.length >= 2) {
    skillsScore += 12;
  } else if (profile.skills.length >= 3) {
    skillsScore += 6;
    skillsMissing.push('Add proof/evidence links for your skills');
  } else {
    skillsMissing.push('Add at least 3 skills with verifiable evidence');
  }
  sections.skills = {
    id: 'skills',
    name: 'Skills & RADIX Taxonomy',
    percentage: skillsScore,
    isComplete: skillsMissing.length === 0,
    missingItems: skillsMissing,
  };
  if (skillsMissing.length > 0) {
    nextSteps.push('Add RADIX-categorized skills with proof/evidence for Talent Check');
  }

  // 6. Projects (10%)
  const projectsMissing: string[] = [];
  let projectsScore = 0;
  if (profile.projects.length > 0) {
    const hasValid = profile.projects.some((p) => p.title.trim() && p.description.trim());
    if (hasValid) projectsScore = 10;
  } else {
    projectsMissing.push('At least one technical project');
    nextSteps.push('Showcase a technical project with repository or live link');
  }
  sections.projects = {
    id: 'projects',
    name: 'Projects',
    percentage: projectsScore,
    isComplete: projectsMissing.length === 0,
    missingItems: projectsMissing,
  };

  // 7. Experience / Internships (5%)
  const expMissing: string[] = [];
  let expScore = 0;
  if (profile.internships_and_experience.length > 0) {
    expScore = 5;
  } else {
    expMissing.push('Professional experience or internship');
  }
  sections.experience = {
    id: 'experience',
    name: 'Experience & Internships',
    percentage: expScore,
    isComplete: expMissing.length === 0,
    missingItems: expMissing,
  };

  // 8. Certifications (5%)
  const certMissing: string[] = [];
  let certScore = 0;
  if (profile.certifications.length > 0) {
    certScore = 5;
  } else {
    certMissing.push('Industry or cloud certification');
  }
  sections.certifications = {
    id: 'certifications',
    name: 'Certifications',
    percentage: certScore,
    isComplete: certMissing.length === 0,
    missingItems: certMissing,
  };

  const overallScore = Math.min(
    100,
    personalScore +
      summaryScore +
      rolesScore +
      eduScore +
      skillsScore +
      projectsScore +
      expScore +
      certScore
  );

  return {
    overallScore,
    sections,
    nextSteps,
  };
};
