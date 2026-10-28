import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Brain,
  FolderGit2,
  Building2,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { CandidateProfile, RadixCategoryCode } from '../types';
import { RADIX_CATEGORY_CODES } from '../types';
import { RADIX_CATEGORIES_METADATA } from '../../../data/radixCategories';
import { Badge, ConfidenceBadge, LinkedinIcon, GithubIcon } from '../../../components';
import { getSafeUrl } from '../schemas';

interface ProfilePreviewProps {
  profile: CandidateProfile;
  completionScore: number;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({ profile, completionScore }) => {
  const { personal_info, preferred_roles, education, skills, projects, internships_and_experience, certifications } =
    profile;

  // Group skills by RADIX Category Code
  const skillsByCategory: Partial<Record<RadixCategoryCode, typeof skills>> = {};
  skills.forEach((skill) => {
    if (!skillsByCategory[skill.category_code]) {
      skillsByCategory[skill.category_code] = [];
    }
    skillsByCategory[skill.category_code]!.push(skill);
  });

  const getInitials = (name: string): string => {
    if (!name.trim()) return 'CP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="preview-container">
      {/* Candidate Hero Card */}
      <div className="preview-hero-card">
        <div className="preview-hero-top">
          <div className="candidate-avatar">
            <span>{getInitials(personal_info.full_name)}</span>
          </div>
          <div className="candidate-heading-info">
            <div className="candidate-name-row">
              <h2 className="candidate-name">
                {personal_info.full_name || <span className="empty-field-placeholder">Candidate Name</span>}
              </h2>
              <span className="candidate-status-pill">
                <Sparkles size={12} color="#0ea5e9" />
                <span>{completionScore}% Profile Readiness</span>
              </span>
            </div>
            <p className="candidate-headline">
              {personal_info.headline || (
                <span className="empty-field-placeholder">Professional Headline / Target Engineering Role</span>
              )}
            </p>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="preview-contact-strip">
          {personal_info.email && (
            <span className="preview-contact-item">
              <Mail size={13} /> {personal_info.email}
            </span>
          )}
          {personal_info.phone && (
            <span className="preview-contact-item">
              <Phone size={13} /> {personal_info.phone}
            </span>
          )}
          {personal_info.location && (
            <span className="preview-contact-item">
              <MapPin size={13} /> {personal_info.location}
            </span>
          )}
        </div>

        {/* Links Strip */}
        {(getSafeUrl(personal_info.links.linkedin) ||
          getSafeUrl(personal_info.links.github) ||
          getSafeUrl(personal_info.links.portfolio) ||
          getSafeUrl(personal_info.links.other)) && (
          <div className="preview-links-strip">
            {getSafeUrl(personal_info.links.linkedin) && (
              <a href={getSafeUrl(personal_info.links.linkedin)} target="_blank" rel="noreferrer" className="preview-link">
                <LinkedinIcon size={13} /> LinkedIn
              </a>
            )}
            {getSafeUrl(personal_info.links.github) && (
              <a href={getSafeUrl(personal_info.links.github)} target="_blank" rel="noreferrer" className="preview-link">
                <GithubIcon size={13} /> GitHub
              </a>
            )}
            {getSafeUrl(personal_info.links.portfolio) && (
              <a href={getSafeUrl(personal_info.links.portfolio)} target="_blank" rel="noreferrer" className="preview-link">
                <Globe size={13} /> Portfolio
              </a>
            )}
            {getSafeUrl(personal_info.links.other) && (
              <a href={getSafeUrl(personal_info.links.other)} target="_blank" rel="noreferrer" className="preview-link">
                <ExternalLink size={13} /> Additional Proof
              </a>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="preview-section">
        <h3 className="preview-section-title">
          <User size={16} /> Executive Summary
        </h3>
        {personal_info.summary ? (
          <p className="preview-summary-text">{personal_info.summary}</p>
        ) : (
          <div className="preview-empty-block">No executive summary entered.</div>
        )}
      </div>

      {/* Preferred Roles & Expectations */}
      <div className="preview-section">
        <h3 className="preview-section-title">
          <Briefcase size={16} /> Target Roles &amp; Work Modalities
        </h3>
        {preferred_roles.target_roles.length > 0 || preferred_roles.job_types.length > 0 ? (
          <div className="preview-roles-box">
            {preferred_roles.target_roles.length > 0 && (
              <div className="preview-role-row">
                <span className="preview-sub-label">Target Positions:</span>
                <div className="preview-tags-row">
                  {preferred_roles.target_roles.map((r, i) => (
                    <span key={i} className="preview-pill primary">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preferred_roles.job_types.length > 0 && (
              <div className="preview-role-row">
                <span className="preview-sub-label">Job Types:</span>
                <div className="preview-tags-row">
                  {preferred_roles.job_types.map((jt, i) => (
                    <span key={i} className="preview-pill neutral">
                      {jt}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preferred_roles.preferred_locations.length > 0 && (
              <div className="preview-role-row">
                <span className="preview-sub-label">Locations:</span>
                <div className="preview-tags-row">
                  {preferred_roles.preferred_locations.map((loc, i) => (
                    <span key={i} className="preview-pill neutral">
                      <MapPin size={11} /> {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(preferred_roles.expected_salary_range || preferred_roles.notice_period_days !== undefined) && (
              <div className="preview-role-row">
                <span className="preview-sub-label">Terms:</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {preferred_roles.expected_salary_range
                    ? `Expected: ${preferred_roles.expected_salary_currency || 'USD'} ${preferred_roles.expected_salary_range}`
                    : ''}
                  {preferred_roles.expected_salary_range && preferred_roles.notice_period_days !== undefined
                    ? ' • '
                    : ''}
                  {preferred_roles.notice_period_days !== undefined
                    ? `Notice: ${preferred_roles.notice_period_days === 0 ? 'Immediate' : `${preferred_roles.notice_period_days} days`}`
                    : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-empty-block">No preferred roles or compensation preferences entered.</div>
        )}
      </div>

      {/* Skills Grouped by RADIX Category */}
      <div className="preview-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="preview-section-title">
            <Brain size={16} /> RADIX Categorized Skills ({skills.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Module 3 Normalized Contract
          </span>
        </div>

        {skills.length === 0 ? (
          <div className="preview-empty-block">No skills added yet.</div>
        ) : (
          <div className="preview-skills-grouped">
            {RADIX_CATEGORY_CODES.map((catCode) => {
              const catSkills = skillsByCategory[catCode];
              if (!catSkills || catSkills.length === 0) return null;
              const meta = RADIX_CATEGORIES_METADATA[catCode];

              return (
                <div key={catCode} className="preview-category-group">
                  <div className="preview-category-header">
                    <Badge categoryCode={catCode} label={meta.categoryName} />
                    <span className="preview-category-count">{catSkills.length} skill{catSkills.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="preview-skills-grid">
                    {catSkills.map((sk) => (
                      <div key={sk.id} className="preview-skill-card">
                        <div className="preview-skill-top">
                          <span className="preview-skill-name">{sk.skill_name}</span>
                          <ConfidenceBadge confidence={sk.confidence} />
                        </div>
                        {sk.evidence && (
                          <div className="preview-skill-evidence">
                            <span className="evidence-tag">Evidence:</span> {sk.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Technical Projects */}
      <div className="preview-section">
        <h3 className="preview-section-title">
          <FolderGit2 size={16} /> Technical Projects ({projects.length})
        </h3>
        {projects.length === 0 ? (
          <div className="preview-empty-block">No technical projects added.</div>
        ) : (
          <div className="preview-projects-list">
            {projects.map((proj) => (
              <div key={proj.id} className="preview-project-card">
                <div className="preview-project-header">
                  <div>
                    <h4 className="preview-project-title">{proj.title}</h4>
                    <span className="preview-project-role">{proj.role}</span>
                  </div>
                  <div className="preview-project-links">
                    {getSafeUrl(proj.live_url) && (
                      <a href={getSafeUrl(proj.live_url)} target="_blank" rel="noreferrer" className="preview-link-btn">
                        <Globe size={12} /> Live Demo
                      </a>
                    )}
                    {getSafeUrl(proj.repo_url) && (
                      <a href={getSafeUrl(proj.repo_url)} target="_blank" rel="noreferrer" className="preview-link-btn">
                        <GithubIcon size={12} /> Source
                      </a>
                    )}
                  </div>
                </div>

                <p className="preview-text">{proj.description}</p>

                {proj.technologies.length > 0 && (
                  <div className="preview-tags-row" style={{ marginTop: '0.5rem' }}>
                    {proj.technologies.map((t, idx) => (
                      <span key={idx} className="preview-pill neutral">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="preview-bullet-list">
                    {proj.highlights.map((h, idx) => (
                      <li key={idx}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Experience */}
      <div className="preview-section">
        <h3 className="preview-section-title">
          <Building2 size={16} /> Work Experience &amp; Internships ({internships_and_experience.length})
        </h3>
        {internships_and_experience.length === 0 ? (
          <div className="preview-empty-block">No work experience or internships added.</div>
        ) : (
          <div className="preview-exp-list">
            {internships_and_experience.map((exp) => (
              <div key={exp.id} className="preview-exp-card">
                <div className="preview-exp-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 className="preview-project-title">{exp.title}</h4>
                      {exp.is_current && <span className="current-badge">Current</span>}
                    </div>
                    <span className="preview-project-role">
                      {exp.company} • {exp.location}
                    </span>
                  </div>
                  <span className="preview-date-badge">
                    <Calendar size={12} /> {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}
                  </span>
                </div>

                {exp.description && <p className="preview-text">{exp.description}</p>}

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="preview-tags-row" style={{ marginTop: '0.4rem' }}>
                    {exp.technologies.map((t, idx) => (
                      <span key={idx} className="preview-pill neutral">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div className="preview-section">
        <h3 className="preview-section-title">
          <GraduationCap size={16} /> Academic Background ({education.length})
        </h3>
        {education.length === 0 ? (
          <div className="preview-empty-block">No academic background added.</div>
        ) : (
          <div className="preview-edu-list">
            {education.map((edu) => (
              <div key={edu.id} className="preview-edu-card">
                <div className="preview-edu-header">
                  <div>
                    <h4 className="preview-project-title">
                      {edu.degree} in {edu.field_of_study}
                    </h4>
                    <span className="preview-project-role">{edu.institution}</span>
                  </div>
                  <span className="preview-date-badge">
                    <Calendar size={12} /> {edu.start_year} – {edu.end_year}
                    {edu.gpa_or_grade ? ` (GPA: ${edu.gpa_or_grade})` : ''}
                  </span>
                </div>
                {edu.highlights && <p className="preview-text">{edu.highlights}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="preview-section">
        <h3 className="preview-section-title">
          <Award size={16} /> Certifications &amp; Accreditations ({certifications.length})
        </h3>
        {certifications.length === 0 ? (
          <div className="preview-empty-block">No certifications added.</div>
        ) : (
          <div className="preview-cert-grid">
            {certifications.map((cert) => (
              <div key={cert.id} className="preview-cert-card">
                <div className="preview-cert-title">{cert.name}</div>
                <div className="preview-cert-issuer">{cert.issuer}</div>
                <div className="preview-cert-meta">
                  <span>Issued: {cert.issue_date}</span>
                  {cert.credential_id && <span> • ID: {cert.credential_id}</span>}
                </div>
                {getSafeUrl(cert.credential_url) && (
                  <a
                    href={getSafeUrl(cert.credential_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="preview-link-btn"
                    style={{ marginTop: '0.4rem', alignSelf: 'flex-start' }}
                  >
                    <ExternalLink size={11} /> Verify
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
