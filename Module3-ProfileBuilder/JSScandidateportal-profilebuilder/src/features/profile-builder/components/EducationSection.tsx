import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2, Edit2, Calendar, Award, Building, Check } from 'lucide-react';
import type { CandidateEducation } from '../types';

interface EducationSectionProps {
  data: CandidateEducation[];
  onChange: (updated: CandidateEducation[]) => void;
}

const emptyEducation = (): CandidateEducation => ({
  id: `edu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
  institution: '',
  degree: '',
  field_of_study: '',
  start_year: '',
  end_year: '',
  gpa_or_grade: '',
  highlights: '',
});

export const EducationSection: React.FC<EducationSectionProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CandidateEducation>(emptyEducation());
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startAdd = () => {
    setDraft(emptyEducation());
    setIsAddingNew(true);
    setEditingId(null);
    setFormErrors({});
  };

  const startEdit = (entry: CandidateEducation) => {
    setDraft({ ...entry });
    setEditingId(entry.id);
    setIsAddingNew(false);
    setFormErrors({});
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setDraft(emptyEducation());
    setFormErrors({});
  };

  const validateDraft = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.institution.trim()) errs.institution = 'Institution is required';
    if (!draft.degree.trim()) errs.degree = 'Degree is required';
    if (!draft.field_of_study.trim()) errs.field_of_study = 'Field of study is required';
    if (!draft.start_year.trim()) errs.start_year = 'Start year is required';
    if (!draft.end_year.trim()) errs.end_year = 'End year is required';
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
          <GraduationCap size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Academic Background &amp; Degrees</h3>
          <p className="section-subtitle">
            List your universities, degrees, engineering coursework, and academic distinctions.
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
            <Plus size={15} /> Add Education
          </button>
        )}
      </div>

      {/* Inline Form for Adding / Editing */}
      {(isAddingNew || editingId) && (
        <div className="card-editor-box">
          <div className="card-editor-header">
            <h4>{isAddingNew ? 'Add Education Record' : 'Edit Education Record'}</h4>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">
                <Building size={14} /> Institution / University
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.institution ? 'has-error' : ''}`}
                placeholder="e.g. Stanford University or UC Berkeley"
                value={draft.institution}
                onChange={(e) => setDraft({ ...draft, institution: e.target.value })}
              />
              {formErrors.institution && <span className="form-error">{formErrors.institution}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">
                <Award size={14} /> Degree
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.degree ? 'has-error' : ''}`}
                placeholder="e.g. Bachelor of Science (B.S.)"
                value={draft.degree}
                onChange={(e) => setDraft({ ...draft, degree: e.target.value })}
              />
              {formErrors.degree && <span className="form-error">{formErrors.degree}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Field of Study / Major</label>
              <input
                type="text"
                className={`form-input ${formErrors.field_of_study ? 'has-error' : ''}`}
                placeholder="e.g. Computer Science, Electrical Engineering"
                value={draft.field_of_study}
                onChange={(e) => setDraft({ ...draft, field_of_study: e.target.value })}
              />
              {formErrors.field_of_study && (
                <span className="form-error">{formErrors.field_of_study}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">GPA or Academic Grade (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 3.85 / 4.00 or First Class with Distinction"
                value={draft.gpa_or_grade || ''}
                onChange={(e) => setDraft({ ...draft, gpa_or_grade: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">
                <Calendar size={14} /> Start Year
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.start_year ? 'has-error' : ''}`}
                placeholder="e.g. 2019"
                value={draft.start_year}
                onChange={(e) => setDraft({ ...draft, start_year: e.target.value })}
              />
              {formErrors.start_year && <span className="form-error">{formErrors.start_year}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">
                <Calendar size={14} /> End Year (or Expected)
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.end_year ? 'has-error' : ''}`}
                placeholder="e.g. 2023"
                value={draft.end_year}
                onChange={(e) => setDraft({ ...draft, end_year: e.target.value })}
              />
              {formErrors.end_year && <span className="form-error">{formErrors.end_year}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Key Highlights / Coursework / Honors</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Algorithms TA, Dean's Honors List, Relevant Coursework: Distributed Systems, Compilers"
              value={draft.highlights || ''}
              onChange={(e) => setDraft({ ...draft, highlights: e.target.value })}
            />
          </div>

          <div className="card-editor-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}>
              <Check size={14} /> {isAddingNew ? 'Add Record' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Education Records List */}
      <div className="item-cards-list">
        {data.length === 0 && !isAddingNew && !editingId && (
          <div className="empty-state-card">
            <GraduationCap size={32} strokeWidth={1.5} />
            <h4>No education records added yet</h4>
            <p>Add your degrees, institutions, and graduation timelines to strengthen profile completeness.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
              <Plus size={15} /> Add Education
            </button>
          </div>
        )}

        {data.map((item) => (
          <div key={item.id} className="entry-card">
            <div className="entry-card-header">
              <div className="entry-title-group">
                <span className="entry-title">
                  {item.degree || 'Degree'} in {item.field_of_study || 'Field of Study'}
                </span>
                <span className="entry-subtitle">
                  {item.institution ? (
                    item.institution
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                      ⚠️ Institution not found in resume — click Edit to enter
                    </span>
                  )}
                </span>
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => startEdit(item)}
                  title="Edit entry"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn danger"
                  onClick={() => removeEntry(item.id)}
                  title="Delete entry"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="entry-card-meta">
              <span className="meta-badge" style={{ color: !item.start_year ? '#f59e0b' : undefined }}>
                <Calendar size={12} /> {item.start_year || 'Year ?'} – {item.end_year || 'Present'}
                {!item.start_year && ' (Start year missing)'}
              </span>
              {item.gpa_or_grade && (
                <span className="meta-badge">
                  <Award size={12} /> GPA: {item.gpa_or_grade}
                </span>
              )}
            </div>

            {item.highlights && <p className="entry-description">{item.highlights}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
