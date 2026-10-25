import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  Link as LinkIcon,
  Filter,
} from 'lucide-react';
import type { CandidateSkill, RadixCategoryCode, SkillConfidence } from '../types';
import { RADIX_CATEGORY_CODES, SKILL_CONFIDENCE_LEVELS } from '../types';
import { RADIX_CATEGORIES_METADATA } from '../../../data/radixCategories';
import { Badge, ConfidenceBadge } from '../../../components';

interface SkillsSectionProps {
  data: CandidateSkill[];
  onChange: (updated: CandidateSkill[]) => void;
}

const emptySkill = (): CandidateSkill => ({
  id: `sk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
  skill_name: '',
  category_code: 'COD',
  evidence: '',
  confidence: 'high',
});

export const SkillsSection: React.FC<SkillsSectionProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CandidateSkill>(emptySkill());
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startAdd = () => {
    setDraft(emptySkill());
    setIsAddingNew(true);
    setEditingId(null);
    setFormErrors({});
  };

  const startEdit = (entry: CandidateSkill) => {
    setDraft({ ...entry });
    setEditingId(entry.id);
    setIsAddingNew(false);
    setFormErrors({});
  };

  const cancelEdit = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setDraft(emptySkill());
    setFormErrors({});
  };

  const validateDraft = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.skill_name.trim()) errs.skill_name = 'Skill name is required';
    if (!draft.category_code) errs.category_code = 'Category code is required';
    if (!draft.confidence) errs.confidence = 'Confidence level is required';
    if (!draft.evidence.trim()) {
      errs.evidence = 'Evidence or proof is required for Talent Check verification';
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

  const filteredSkills =
    filterCategory === 'ALL'
      ? data
      : data.filter((s) => s.category_code === filterCategory);

  const selectedCategoryMeta = RADIX_CATEGORIES_METADATA[draft.category_code];

  return (
    <div className="section-container">
      <div className="section-header-box">
        <div className="section-icon-badge">
          <Brain size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="section-title">Technical Skills &amp; RADIX Taxonomy</h3>
          <p className="section-subtitle">
            Tag your technical proficiencies with one of 13 RADIX category codes and provide verifiable proof
            (GitHub PRs, live systems, coursework) for Module 4 Talent Check.
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
            <Plus size={15} /> Add Skill
          </button>
        )}
      </div>

      {/* Inline Form for Adding / Editing Skill */}
      {(isAddingNew || editingId) && (
        <div className="card-editor-box">
          <div className="card-editor-header">
            <h4>{isAddingNew ? 'Add Skill with RADIX Code' : 'Edit Skill & Evidence'}</h4>
          </div>

          <div className="form-grid-2">
            {/* Skill Name */}
            <div className="form-group">
              <label className="form-label required">Skill Name / Technology</label>
              <input
                type="text"
                className={`form-input ${formErrors.skill_name ? 'has-error' : ''}`}
                placeholder="e.g. TypeScript, Kafka, Graph Algorithms, PostgreSQL"
                value={draft.skill_name}
                onChange={(e) => setDraft({ ...draft, skill_name: e.target.value })}
              />
              {formErrors.skill_name && <span className="form-error">{formErrors.skill_name}</span>}
            </div>

            {/* RADIX Category Selector */}
            <div className="form-group">
              <label className="form-label required">
                RADIX Category Code ({RADIX_CATEGORY_CODES.length} Available)
              </label>
              <select
                className={`form-select ${formErrors.category_code ? 'has-error' : ''}`}
                value={draft.category_code}
                onChange={(e) => setDraft({ ...draft, category_code: e.target.value as RadixCategoryCode })}
              >
                {RADIX_CATEGORY_CODES.map((code) => {
                  const meta = RADIX_CATEGORIES_METADATA[code];
                  return (
                    <option key={code} value={code}>
                      [{code}] {meta.categoryName}
                    </option>
                  );
                })}
              </select>
              {selectedCategoryMeta && (
                <span className="form-helper" style={{ color: selectedCategoryMeta.color }}>
                  {selectedCategoryMeta.description}
                </span>
              )}
            </div>
          </div>

          {/* Confidence Level Selector */}
          <div className="form-group">
            <label className="form-label required">
              <ShieldCheck size={14} /> Self-Assessed Confidence Level
            </label>
            <div className="confidence-selector-row">
              {SKILL_CONFIDENCE_LEVELS.map((level) => {
                const isSelected = draft.confidence === level;
                return (
                  <button
                    key={level}
                    type="button"
                    className={`confidence-option-btn ${isSelected ? 'selected' : ''} ${level}`}
                    onClick={() => setDraft({ ...draft, confidence: level as SkillConfidence })}
                  >
                    <ConfidenceBadge confidence={level} />
                    <span className="confidence-level-desc">
                      {level === 'high' && 'Extensive production or complex project application'}
                      {level === 'medium' && 'Solid conceptual grounding with academic / personal usage'}
                      {level === 'low' && 'Foundational knowledge or basic familiarity'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verifiable Evidence */}
          <div className="form-group">
            <label className="form-label required">
              <LinkIcon size={14} /> Verifiable Evidence &amp; Proof
            </label>
            <textarea
              className={`form-textarea ${formErrors.evidence ? 'has-error' : ''}`}
              rows={3}
              placeholder="e.g. Architected microservice with Kafka: github.com/user/repo or Solved 500+ LeetCode problems: leetcode.com/user"
              value={draft.evidence}
              onChange={(e) => setDraft({ ...draft, evidence: e.target.value })}
            />
            {formErrors.evidence && <span className="form-error">{formErrors.evidence}</span>}
            <span className="form-helper">
              Provide project links, repository PRs, competition rankings, or specific application context for Talent Check verification.
            </span>
          </div>

          <div className="card-editor-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}>
              <Check size={14} /> {isAddingNew ? 'Add Skill' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Filter by Category Bar */}
      {data.length > 0 && (
        <div className="filter-strip">
          <span className="filter-label">
            <Filter size={13} /> Filter:
          </span>
          <button
            type="button"
            className={`filter-chip ${filterCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterCategory('ALL')}
          >
            All ({data.length})
          </button>
          {RADIX_CATEGORY_CODES.filter((code) => data.some((s) => s.category_code === code)).map(
            (code) => {
              const count = data.filter((s) => s.category_code === code).length;
              const meta = RADIX_CATEGORIES_METADATA[code];
              return (
                <button
                  key={code}
                  type="button"
                  className={`filter-chip ${filterCategory === code ? 'active' : ''}`}
                  onClick={() => setFilterCategory(code)}
                  style={{
                    borderColor: filterCategory === code ? meta.color : 'transparent',
                    color: filterCategory === code ? meta.color : undefined,
                  }}
                >
                  {code} ({count})
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Existing Skills List */}
      <div className="item-cards-list">
        {data.length === 0 && !isAddingNew && !editingId && (
          <div className="empty-state-card">
            <Brain size={32} strokeWidth={1.5} />
            <h4>No skills added yet</h4>
            <p>
              Add your technical competencies tagged with RADIX categories (COD, DSA, AI, CLOUD, SQL, etc.)
              and verifiable evidence.
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>
              <Plus size={15} /> Add First Skill
            </button>
          </div>
        )}

        {filteredSkills.map((item) => (
          <div key={item.id} className="skill-card-row">
            <div className="skill-card-main">
              <div className="skill-header-line">
                <span className="skill-name-text">{item.skill_name}</span>
                <Badge categoryCode={item.category_code} />
                <ConfidenceBadge confidence={item.confidence} />
              </div>
              <div className="skill-evidence-preview">
                <strong>Proof / Evidence:</strong>{' '}
                {item.evidence ? (
                  item.evidence
                ) : (
                  <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                    ⚠️ Missing evidence — please provide project/code proof link for Talent Check
                  </span>
                )}
              </div>
            </div>

            <div className="entry-actions">
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => startEdit(item)}
                title="Edit skill"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="icon-action-btn danger"
                onClick={() => removeEntry(item.id)}
                title="Delete skill"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
