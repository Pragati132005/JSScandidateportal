import React, { useState } from 'react';
import { Building2, Plus, Trash2, Edit2, Calendar, MapPin, Check } from 'lucide-react';
import type { CandidateExperience } from '../types';
import { TagInput } from '../../../components';

interface ExperienceSectionProps {
  data: CandidateExperience[];
  onChange: (updated: CandidateExperience[]) => void;
}

const emptyExperience = (): CandidateExperience => ({
  id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
  company: '',
  title: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
  technologies: [],
});

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CandidateExperience>(emptyExperience());
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startAdd = () => {
    setDraft(emptyExperience());
    setIsAddingNew(true);
    setEditingId(null);
    setFormErrors({});
  };

  const startEdit = (entry: CandidateExperience) => {
    setDraft({ ...entry });
    setEditingId(entry.id);
    setIsAddingNew(false);
    setFormErrors({});
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setDraft(emptyExperience());
    setFormErrors({});
  };

  const validateDraft = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.company.trim()) errs.company = 'Company name is required';
    if (!draft.title.trim()) errs.title = 'Job title is required';
    if (!draft.location.trim()) errs.location = 'Location is required';
    if (!draft.start_date.trim()) errs.start_date = 'Start date is required';
    if (!draft.is_current && !draft.end_date.trim()) {
      errs.end_date = 'End date is required for past roles';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveDraft = () => {
    if (!validateDraft()) return;

    if (isAddingNew) {
      onChange([...data, draft]);
    } else {
      onChange(data.map((item) => (item.id === draft.id ? draft : item)));
    }
    cancelEdit();
  };

  const removeEntry = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
    if (editingId === id) cancelEdit();
  };

  return (
    <div className="section-container">
      <div className="section-header-box">
        <div className="section-icon-badge">
          <Building2 size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Work Experience &amp; Internships</h3>
          <p className="section-subtitle">
            Document your professional software engineering roles, team contributions, and technical scope.
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
            <Plus size={15} /> Add Experience
          </button>
        )}
      </div>

      {/* Inline Form for Adding / Editing Experience */}
      {(isAddingNew || editingId) && (
        <div className="card-editor-box">
          <div className="card-editor-header">
            <h4>{isAddingNew ? 'Add Professional Experience' : 'Edit Experience Record'}</h4>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Company / Organization</label>
              <input
                type="text"
                className={`form-input ${formErrors.company ? 'has-error' : ''}`}
                placeholder="e.g. ScaleGrid Systems"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
              {formErrors.company && <span className="form-error">{formErrors.company}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Job Title</label>
              <input
                type="text"
                className={`form-input ${formErrors.title ? 'has-error' : ''}`}
                placeholder="e.g. Senior Software Engineer"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              {formErrors.title && <span className="form-error">{formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">
                <MapPin size={14} /> Location
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.location ? 'has-error' : ''}`}
                placeholder="e.g. San Francisco, CA or Remote"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
              {formErrors.location && <span className="form-error">{formErrors.location}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">
                <Calendar size={14} /> Start Date (YYYY-MM)
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.start_date ? 'has-error' : ''}`}
                placeholder="e.g. 2022-06"
                value={draft.start_date}
                onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
              />
              {formErrors.start_date && <span className="form-error">{formErrors.start_date}</span>}
            </div>
          </div>

          {/* Current Role Checkbox & End Date */}
          <div className="form-group">
            <div className="checkbox-row" style={{ marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                id="is_current_checkbox"
                checked={draft.is_current}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDraft({
                    ...draft,
                    is_current: checked,
                    end_date: checked ? '' : draft.end_date,
                  });
                }}
              />
              <label htmlFor="is_current_checkbox" style={{ cursor: 'pointer', fontWeight: 500 }}>
                I currently work in this role
              </label>
            </div>

            {!draft.is_current && (
              <div style={{ maxWidth: '300px' }}>
                <label className="form-label required">
                  <Calendar size={14} /> End Date (YYYY-MM)
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.end_date ? 'has-error' : ''}`}
                  placeholder="e.g. 2024-05"
                  value={draft.end_date}
                  onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
                />
                {formErrors.end_date && <span className="form-error">{formErrors.end_date}</span>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Role Responsibilities &amp; Impact</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe your primary ownership areas, systems built, architectural decisions, and team leadership..."
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          {/* Technologies Used */}
          <TagInput
            label="Technologies Used in this Role"
            helperText="Press Enter or comma to add (e.g., Go, React, Kubernetes, AWS)."
            placeholder="e.g. Docker"
            tags={draft.technologies}
            onChange={(techs) => setDraft({ ...draft, technologies: techs })}
          />

          <div className="card-editor-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}>
              <Check size={14} /> {isAddingNew ? 'Add Experience' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Experience Cards List */}
      <div className="item-cards-list">
        {data.length === 0 && !isAddingNew && !editingId && (
          <div className="empty-state-card">
            <Building2 size={32} strokeWidth={1.5} />
            <h4>No experience records added yet</h4>
            <p>Add internships or full-time software engineering roles to complete your career history.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
              <Plus size={15} /> Add First Experience
            </button>
          </div>
        )}

        {data.map((item) => (
          <div key={item.id} className="entry-card">
            <div className="entry-card-header">
              <div className="entry-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="entry-title">{item.title}</span>
                  {item.is_current ? (
                    <span className="current-badge">Current Role</span>
                  ) : (
                    <span className="past-badge">Completed</span>
                  )}
                </div>
                <span className="entry-subtitle">
                  {item.company || item.location ? (
                    `${item.company || 'Company ?'} • ${item.location || 'Location ?'}`
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                      ⚠️ Company &amp; location not found in resume — click Edit to enter
                    </span>
                  )}
                </span>
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => startEdit(item)}
                  title="Edit experience"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn danger"
                  onClick={() => removeEntry(item.id)}
                  title="Delete experience"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="entry-card-meta">
              <span className="meta-badge">
                <Calendar size={12} /> {item.start_date} – {item.is_current ? 'Present' : item.end_date}
              </span>
            </div>

            {item.description && <p className="entry-description">{item.description}</p>}

            {item.technologies && item.technologies.length > 0 && (
              <div className="tech-badge-container">
                {item.technologies.map((t, idx) => (
                  <span key={idx} className="tech-pill">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
