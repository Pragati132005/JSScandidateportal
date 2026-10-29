import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Globe,
  Check,
  X,
  ListPlus,
} from 'lucide-react';
import type { CandidateProject } from '../types';
import { TagInput, GithubIcon } from '../../../components';

interface ProjectsSectionProps {
  data: CandidateProject[];
  onChange: (updated: CandidateProject[]) => void;
}

const emptyProject = (): CandidateProject => ({
  id: `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
  title: '',
  role: '',
  description: '',
  technologies: [],
  live_url: '',
  repo_url: '',
  start_date: '',
  end_date: '',
  highlights: [],
});

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CandidateProject>(emptyProject());
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [highlightInput, setHighlightInput] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startAdd = () => {
    setDraft(emptyProject());
    setIsAddingNew(true);
    setEditingId(null);
    setHighlightInput('');
    setFormErrors({});
  };

  const startEdit = (entry: CandidateProject) => {
    setDraft({ ...entry });
    setEditingId(entry.id);
    setIsAddingNew(false);
    setHighlightInput('');
    setFormErrors({});
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setDraft(emptyProject());
    setHighlightInput('');
    setFormErrors({});
  };

  const validateDraft = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Project title is required';
    if (!draft.role.trim()) errs.role = 'Role is required';
    if (!draft.description.trim()) errs.description = 'Description is required';
    if (draft.technologies.length === 0) errs.technologies = 'At least one technology is required';
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

  const addHighlight = () => {
    const trimmed = highlightInput.trim();
    if (trimmed) {
      setDraft({
        ...draft,
        highlights: [...draft.highlights, trimmed],
      });
      setHighlightInput('');
    }
  };

  const removeHighlight = (idx: number) => {
    setDraft({
      ...draft,
      highlights: draft.highlights.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="section-container">
      <div className="section-header-box">
        <div className="section-icon-badge">
          <FolderGit2 size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Technical Projects &amp; Implementations</h3>
          <p className="section-subtitle">
            Highlight production systems, open-source repositories, hackathon winners, and verifiable builds.
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
            <Plus size={15} /> Add Project
          </button>
        )}
      </div>

      {/* Inline Form for Adding / Editing Project */}
      {(isAddingNew || editingId) && (
        <div className="card-editor-box">
          <div className="card-editor-header">
            <h4>{isAddingNew ? 'Add Technical Project' : 'Edit Project Details'}</h4>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Project Title</label>
              <input
                type="text"
                className={`form-input ${formErrors.title ? 'has-error' : ''}`}
                placeholder="e.g. AetherFlow Stream Engine"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              {formErrors.title && <span className="form-error">{formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Your Role / Responsibility</label>
              <input
                type="text"
                className={`form-input ${formErrors.role ? 'has-error' : ''}`}
                placeholder="e.g. Lead Full Stack Architect or Solo Developer"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              />
              {formErrors.role && <span className="form-error">{formErrors.role}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} /> Start Date (YYYY-MM)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2023-01"
                value={draft.start_date || ''}
                onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} /> End Date (or Ongoing)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2024-03 or Ongoing"
                value={draft.end_date || ''}
                onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Globe size={14} /> Live Demo URL (Optional)
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://myproject.demo.com"
                value={draft.live_url || ''}
                onChange={(e) => setDraft({ ...draft, live_url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <GithubIcon size={14} /> Repository URL (Optional)
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/username/project"
                value={draft.repo_url || ''}
                onChange={(e) => setDraft({ ...draft, repo_url: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Project Summary &amp; Architecture</label>
            <textarea
              className={`form-textarea ${formErrors.description ? 'has-error' : ''}`}
              rows={3}
              placeholder="Describe the problem solved, architectural approach, and core components..."
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            {formErrors.description && <span className="form-error">{formErrors.description}</span>}
          </div>

          {/* Technologies TagInput */}
          <TagInput
            label="Technologies & Frameworks Used"
            helperText="Press Enter or comma to add (e.g., React, TypeScript, Kafka, Docker)."
            placeholder="e.g. TypeScript"
            tags={draft.technologies}
            onChange={(techs) => setDraft({ ...draft, technologies: techs })}
            error={formErrors.technologies}
          />

          {/* Highlights / Bullet points */}
          <div className="form-group">
            <label className="form-label">
              <ListPlus size={14} /> Key Highlights &amp; Metrics
            </label>
            <div className="bullet-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sustained 45,000 requests/sec with p99 latency < 20ms"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addHighlight}
                disabled={!highlightInput.trim()}
              >
                Add Highlight
              </button>
            </div>

            {draft.highlights.length > 0 && (
              <ul className="highlight-bullet-list">
                {draft.highlights.map((hl, idx) => (
                  <li key={idx} className="highlight-bullet-item">
                    <span>{hl}</span>
                    <button
                      type="button"
                      className="bullet-remove-btn"
                      onClick={() => removeHighlight(idx)}
                      title="Remove highlight"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-editor-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}>
              <Check size={14} /> {isAddingNew ? 'Add Project' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Project Cards List */}
      <div className="item-cards-list">
        {data.length === 0 && !isAddingNew && !editingId && (
          <div className="empty-state-card">
            <FolderGit2 size={32} strokeWidth={1.5} />
            <h4>No projects added yet</h4>
            <p>Showcase technical engineering projects to prove your abilities for Talent Check.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
              <Plus size={15} /> Add First Project
            </button>
          </div>
        )}

        {data.map((proj) => (
          <div key={proj.id} className="entry-card">
            <div className="entry-card-header">
              <div className="entry-title-group">
                <span className="entry-title">{proj.title}</span>
                <span className="entry-subtitle">{proj.role}</span>
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => startEdit(proj)}
                  title="Edit project"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn danger"
                  onClick={() => removeEntry(proj.id)}
                  title="Delete project"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="entry-card-meta">
              {(proj.start_date || proj.end_date) && (
                <span className="meta-badge">
                  <Calendar size={12} /> {proj.start_date || 'Start'} – {proj.end_date || 'Ongoing'}
                </span>
              )}
              {proj.live_url && (
                <a
                  href={proj.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="meta-link-badge"
                >
                  <Globe size={12} /> Live Demo
                </a>
              )}
              {proj.repo_url && (
                <a
                  href={proj.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="meta-link-badge"
                >
                  <GithubIcon size={12} /> Source Code
                </a>
              )}
            </div>

            <p className="entry-description">{proj.description}</p>

            {proj.technologies.length > 0 && (
              <div className="tech-badge-container">
                {proj.technologies.map((t, idx) => (
                  <span key={idx} className="tech-pill">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {proj.highlights && proj.highlights.length > 0 && (
              <ul className="entry-bullets">
                {proj.highlights.map((hl, idx) => (
                  <li key={idx}>{hl}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
