import React from 'react';
import { Briefcase, DollarSign, Clock, Check } from 'lucide-react';
import type { CandidatePreferredRoles, JobTypePreference } from '../types';
import { TagInput } from '../../../components';

interface PreferredRolesSectionProps {
  data: CandidatePreferredRoles;
  onChange: (updated: CandidatePreferredRoles) => void;
}

const AVAILABLE_JOB_TYPES: { id: JobTypePreference; label: string }[] = [
  { id: 'full-time', label: 'Full-Time' },
  { id: 'internship', label: 'Internship' },
  { id: 'contract', label: 'Contract / Freelance' },
  { id: 'remote', label: 'Remote Only' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€', name: 'EUR — Euro' },
  { code: 'GBP', symbol: '£', name: 'GBP — British Pound' },
  { code: 'INR', symbol: '₹', name: 'INR — Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'CAD — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'AUD — Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'SGD — Singapore Dollar' },
];

export const PreferredRolesSection: React.FC<PreferredRolesSectionProps> = ({
  data,
  onChange,
}) => {
  const toggleJobType = (type: JobTypePreference) => {
    const exists = data.job_types.includes(type);
    const updated = exists
      ? data.job_types.filter((t) => t !== type)
      : [...data.job_types, type];
    onChange({ ...data, job_types: updated });
  };

  return (
    <div className="section-container">
      <div className="section-header-box">
        <div className="section-icon-badge">
          <Briefcase size={20} />
        </div>
        <div>
          <h3 className="section-title">Preferred Roles &amp; Work Expectations</h3>
          <p className="section-subtitle">
            Specify your desired positions, work modalities, target compensation, and availability.
          </p>
        </div>
      </div>

      {/* Target Roles */}
      <TagInput
        label="Target Job Roles"
        helperText="Press Enter or comma to add multiple titles (e.g., Full Stack Engineer, Backend Architect)."
        placeholder="e.g. Senior Frontend Engineer"
        tags={data.target_roles}
        onChange={(roles) => onChange({ ...data, target_roles: roles })}
      />

      {/* Job Types Multi-select */}
      <div className="form-group">
        <label className="form-label">
          <Briefcase size={14} /> Employment Modality / Job Types
        </label>
        <div className="job-types-selector-grid">
          {AVAILABLE_JOB_TYPES.map(({ id, label }) => {
            const isSelected = data.job_types.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`job-type-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleJobType(id)}
              >
                <div className={`checkbox-indicator ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        {data.job_types.length === 0 && (
          <span className="form-helper" style={{ color: '#f59e0b', marginTop: '0.4rem', display: 'block' }}>
            Not found in resume — please select employment preferences (e.g. Full-Time, Remote).
          </span>
        )}
      </div>

      {/* Preferred Locations */}
      <TagInput
        label="Preferred Work Locations"
        helperText="List specific cities, states, or 'Remote' options you are targeting."
        placeholder="e.g. San Francisco, CA or Remote"
        tags={data.preferred_locations}
        onChange={(locs) => onChange({ ...data, preferred_locations: locs })}
      />

      {/* Compensation & Availability Grid */}
      <div className="form-grid-3">
        {/* Currency */}
        <div className="form-group">
          <label className="form-label">
            <DollarSign size={14} /> Currency
          </label>
          <select
            className="form-select"
            value={data.expected_salary_currency || ''}
            onChange={(e) => onChange({ ...data, expected_salary_currency: e.target.value })}
          >
            <option value="">-- Not in resume (Select currency) --</option>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Expected Salary Range */}
        <div className="form-group">
          <label className="form-label">Expected Salary Range</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. $130,000 - $160,000"
            value={data.expected_salary_range || ''}
            onChange={(e) => onChange({ ...data, expected_salary_range: e.target.value })}
          />
        </div>

        {/* Notice Period */}
        <div className="form-group">
          <label className="form-label">
            <Clock size={14} /> Notice Period (Days)
          </label>
          <input
            type="number"
            min={0}
            max={180}
            className="form-input"
            placeholder="e.g. 15 or 30 (0 for Immediate)"
            value={data.notice_period_days !== undefined ? data.notice_period_days : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
              onChange({ ...data, notice_period_days: isNaN(val as number) ? undefined : val });
            }}
          />
          <span className="form-helper">Enter 0 if immediately available.</span>
        </div>
      </div>
    </div>
  );
};
