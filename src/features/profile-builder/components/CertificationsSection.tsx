import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit2, Calendar, ShieldCheck, ExternalLink, Check } from 'lucide-react';
import type { CandidateCertification } from '../types';

interface CertificationsSectionProps {
  data: CandidateCertification[];
  onChange: (updated: CandidateCertification[]) => void;
}

const emptyCert = (): CandidateCertification => ({
  id: `cert-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
  name: '',
  issuer: '',
  issue_date: '',
  expiration_date: '',
  credential_id: '',
  credential_url: '',
});

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  data,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CandidateCertification>(emptyCert());
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startAdd = () => {
    setDraft(emptyCert());
    setIsAddingNew(true);
    setEditingId(null);
    setFormErrors({});
  };

  const startEdit = (entry: CandidateCertification) => {
    setDraft({ ...entry });
    setEditingId(entry.id);
    setIsAddingNew(false);
    setFormErrors({});
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setDraft(emptyCert());
    setFormErrors({});
  };

  const validateDraft = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = 'Certification name is required';
    if (!draft.issuer.trim()) errs.issuer = 'Issuing organization is required';
    if (!draft.issue_date.trim()) errs.issue_date = 'Issue date is required';
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
          <Award size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Certifications &amp; Accreditations</h3>
          <p className="section-subtitle">
            Add cloud certifications (AWS, GCP, Azure), Kubernetes badges, or specialized technical licenses.
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
            <Plus size={15} /> Add Certification
          </button>
        )}
      </div>

      {/* Inline Form for Adding / Editing Certification */}
      {(isAddingNew || editingId) && (
        <div className="card-editor-box">
          <div className="card-editor-header">
            <h4>{isAddingNew ? 'Add Certification' : 'Edit Certification'}</h4>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Certification Name</label>
              <input
                type="text"
                className={`form-input ${formErrors.name ? 'has-error' : ''}`}
                placeholder="e.g. AWS Certified Solutions Architect – Associate"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              {formErrors.name && <span className="form-error">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Issuing Organization</label>
              <input
                type="text"
                className={`form-input ${formErrors.issuer ? 'has-error' : ''}`}
                placeholder="e.g. Amazon Web Services or CNCF"
                value={draft.issuer}
                onChange={(e) => setDraft({ ...draft, issuer: e.target.value })}
              />
              {formErrors.issuer && <span className="form-error">{formErrors.issuer}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">
                <Calendar size={14} /> Issue Date (YYYY-MM)
              </label>
              <input
                type="text"
                className={`form-input ${formErrors.issue_date ? 'has-error' : ''}`}
                placeholder="e.g. 2023-05"
                value={draft.issue_date}
                onChange={(e) => setDraft({ ...draft, issue_date: e.target.value })}
              />
              {formErrors.issue_date && <span className="form-error">{formErrors.issue_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} /> Expiration Date (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2026-05 or Does not expire"
                value={draft.expiration_date || ''}
                onChange={(e) => setDraft({ ...draft, expiration_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credential ID / License Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AWS-SAA-8392014"
                value={draft.credential_id || ''}
                onChange={(e) => setDraft({ ...draft, credential_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <ExternalLink size={14} /> Verification URL
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://aws.amazon.com/verification/..."
                value={draft.credential_url || ''}
                onChange={(e) => setDraft({ ...draft, credential_url: e.target.value })}
              />
            </div>
          </div>

          <div className="card-editor-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}>
              <Check size={14} /> {isAddingNew ? 'Add Certification' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Certifications List */}
      <div className="item-cards-list">
        {data.length === 0 && !isAddingNew && !editingId && (
          <div className="empty-state-card">
            <Award size={32} strokeWidth={1.5} />
            <h4>No certifications added yet</h4>
            <p>Add industry accreditations to increase verification confidence in Module 4.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
              <Plus size={15} /> Add First Certification
            </button>
          </div>
        )}

        {data.map((cert) => (
          <div key={cert.id} className="entry-card">
            <div className="entry-card-header">
              <div className="entry-title-group">
                <span className="entry-title">{cert.name}</span>
                <span className="entry-subtitle">{cert.issuer}</span>
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => startEdit(cert)}
                  title="Edit certification"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn danger"
                  onClick={() => removeEntry(cert.id)}
                  title="Delete certification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="entry-card-meta">
              <span className="meta-badge">
                <Calendar size={12} /> Issued: {cert.issue_date}
                {cert.expiration_date ? ` • Expires: ${cert.expiration_date}` : ''}
              </span>
              {cert.credential_id && (
                <span className="meta-badge">
                  <ShieldCheck size={12} /> ID: {cert.credential_id}
                </span>
              )}
              {cert.credential_url && (
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noreferrer"
                  className="meta-link-badge"
                >
                  <ExternalLink size={12} /> Verify Credential
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
