import React from 'react';
import { User, Mail, Phone, MapPin, Sparkles, Globe, ExternalLink } from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../../../components';
import type { CandidatePersonalInfo } from '../types';
import type { ValidationErrorMap } from '../schemas';

interface PersonalInfoSectionProps {
  data: CandidatePersonalInfo;
  onChange: (updated: CandidatePersonalInfo) => void;
  errors?: ValidationErrorMap;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const handleChange = (field: keyof CandidatePersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleLinkChange = (field: keyof CandidatePersonalInfo['links'], value: string) => {
    onChange({
      ...data,
      links: {
        ...data.links,
        [field]: value,
      },
    });
  };

  return (
    <div className="section-container">
      <div className="section-header-box">
        <div className="section-icon-badge">
          <User size={20} />
        </div>
        <div>
          <h3 className="section-title">Personal Information</h3>
          <p className="section-subtitle">
            Provide your contact details, professional identity, and verified social portfolios.
          </p>
        </div>
      </div>

      <div className="form-grid-2">
        {/* Full Name */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label required" style={{ marginBottom: 0 }}>
              <User size={14} /> Full Name
            </label>
            {data.full_name.trim() && (
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Extracted from resume
              </span>
            )}
          </div>
          <input
            type="text"
            className={`form-input ${errors.full_name ? 'has-error' : ''}`}
            placeholder="e.g. Alex Rivera"
            value={data.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
          />
          {errors.full_name && <span className="form-error">{errors.full_name}</span>}
        </div>

        {/* Email Address */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label required" style={{ marginBottom: 0 }}>
              <Mail size={14} /> Email Address
            </label>
            {data.email.trim() ? (
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Entered by candidate
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Not found in resume
              </span>
            )}
          </div>
          <input
            type="email"
            className={`form-input ${errors.email ? 'has-error' : ''}`}
            placeholder="e.g. alex.rivera@example.com"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          {errors.email ? (
            <span className="form-error">{errors.email}</span>
          ) : !data.email.trim() ? (
            <span className="form-helper" style={{ color: '#f59e0b' }}>
              Not found in resume — please enter this required information.
            </span>
          ) : null}
        </div>

        {/* Phone */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label required" style={{ marginBottom: 0 }}>
              <Phone size={14} /> Phone Number
            </label>
            {data.phone.trim() ? (
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Entered by candidate
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Not found in resume
              </span>
            )}
          </div>
          <input
            type="tel"
            className={`form-input ${errors.phone ? 'has-error' : ''}`}
            placeholder="e.g. +1 (555) 019-2834"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          {errors.phone ? (
            <span className="form-error">{errors.phone}</span>
          ) : !data.phone.trim() ? (
            <span className="form-helper" style={{ color: '#f59e0b' }}>
              Not found in resume — please enter this required information.
            </span>
          ) : null}
        </div>

        {/* Location */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label required" style={{ marginBottom: 0 }}>
              <MapPin size={14} /> Location / Timezone
            </label>
            {data.location.trim() ? (
              <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Entered by candidate
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                Not found in resume
              </span>
            )}
          </div>
          <input
            type="text"
            className={`form-input ${errors.location ? 'has-error' : ''}`}
            placeholder="e.g. San Francisco, CA (Open to Remote)"
            value={data.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
          {errors.location ? (
            <span className="form-error">{errors.location}</span>
          ) : !data.location.trim() ? (
            <span className="form-helper" style={{ color: '#f59e0b' }}>
              Not found in resume — please enter your location / city.
            </span>
          ) : null}
        </div>
      </div>

      {/* Professional Headline */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <label className="form-label required" style={{ marginBottom: 0 }}>
            <Sparkles size={14} /> Professional Headline
          </label>
          {data.headline.trim() && (
            <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
              Extracted from resume
            </span>
          )}
        </div>
        <input
          type="text"
          className={`form-input ${errors.headline ? 'has-error' : ''}`}
          placeholder="e.g. Senior Full Stack Engineer & Cloud Systems Architect"
          value={data.headline}
          onChange={(e) => handleChange('headline', e.target.value)}
        />
        {errors.headline && <span className="form-error">{errors.headline}</span>}
        <span className="form-helper">
          A concise summary of your primary technical identity (used by JD Analytics & Matching).
        </span>
      </div>

      {/* Professional Summary */}
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Professional Summary</label>
          {data.summary.trim() && (
            <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
              Extracted from resume
            </span>
          )}
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Highlight your key achievements, architectural proficiencies, and engineering strengths..."
          value={data.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
        />
        <span className="form-helper">
          Recommended: 2–4 sentences describing your engineering background and domain passions.
        </span>
      </div>

      {/* Professional Links */}
      <div className="form-sub-section">
        <h4 className="sub-section-title">Professional Links &amp; Profiles</h4>
        <div className="form-grid-2">
          {/* LinkedIn */}
          <div className="form-group">
            <label className="form-label">
              <LinkedinIcon size={14} /> LinkedIn URL
            </label>
            <input
              type="url"
              className={`form-input ${errors.linkedin ? 'has-error' : ''}`}
              placeholder="https://linkedin.com/in/username"
              value={data.links.linkedin || ''}
              onChange={(e) => handleLinkChange('linkedin', e.target.value)}
            />
            {errors.linkedin && <span className="form-error">{errors.linkedin}</span>}
          </div>

          {/* GitHub */}
          <div className="form-group">
            <label className="form-label">
              <GithubIcon size={14} /> GitHub URL
            </label>
            <input
              type="url"
              className={`form-input ${errors.github ? 'has-error' : ''}`}
              placeholder="https://github.com/username"
              value={data.links.github || ''}
              onChange={(e) => handleLinkChange('github', e.target.value)}
            />
            {errors.github && <span className="form-error">{errors.github}</span>}
          </div>

          {/* Portfolio */}
          <div className="form-group">
            <label className="form-label">
              <Globe size={14} /> Portfolio / Personal Website
            </label>
            <input
              type="url"
              className={`form-input ${errors.portfolio ? 'has-error' : ''}`}
              placeholder="https://yourdomain.com"
              value={data.links.portfolio || ''}
              onChange={(e) => handleLinkChange('portfolio', e.target.value)}
            />
            {errors.portfolio && <span className="form-error">{errors.portfolio}</span>}
          </div>

          {/* Other Link */}
          <div className="form-group">
            <label className="form-label">
              <ExternalLink size={14} /> Other Profile (e.g. LeetCode, Kaggle, Blog)
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://leetcode.com/username"
              value={data.links.other || ''}
              onChange={(e) => handleLinkChange('other', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
