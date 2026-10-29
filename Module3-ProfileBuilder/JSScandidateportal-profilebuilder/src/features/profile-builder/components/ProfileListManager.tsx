import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  Sparkles,
  Layers,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Download,
  UploadCloud,
} from 'lucide-react';
import type { CandidateProfile } from '../types';
import { calculateProfileCompletion } from '../services';

interface ProfileListManagerProps {
  profiles: CandidateProfile[];
  activeProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onPreviewProfile: (profile: CandidateProfile) => void;
  onCreateNew: () => void;
  onDeleteProfile: (profileId: string) => void;
  onBackToEditor: () => void;
  onLoadSample: () => void;
  onExportProfile: (profile: CandidateProfile) => void;
  onOpenImportModal: () => void;
}

export const ProfileListManager: React.FC<ProfileListManagerProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onPreviewProfile,
  onCreateNew,
  onDeleteProfile,
  onBackToEditor,
  onLoadSample,
  onExportProfile,
  onOpenImportModal,
}) => {
  const [profileToDelete, setProfileToDelete] = useState<CandidateProfile | null>(null);

  const confirmDelete = () => {
    if (profileToDelete) {
      onDeleteProfile(profileToDelete.profile_id);
      setProfileToDelete(null);
    }
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return 'Not yet saved';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="section-container profile-manager-container">
      {/* Header */}
      <div className="section-header-box" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="section-icon-badge">
            <Users size={20} />
          </div>
          <div>
            <h3 className="section-title">Saved Candidate Profiles ({profiles.length})</h3>
            <p className="section-subtitle">
              Manage multi-profile candidates locally. Import or export canonical RADIX profiles as JSON.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBackToEditor}>
            <ArrowLeft size={14} /> Back to Editor
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenImportModal}>
            <UploadCloud size={14} color="#38bdf8" /> Import JSON
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onCreateNew}>
            <Plus size={14} /> New Profile
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {profileToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-modal-header">
              <div className="delete-warning-icon">
                <AlertCircle size={22} />
              </div>
              <div>
                <h4>Confirm Profile Deletion</h4>
                <p>This action cannot be undone and will permanently remove this candidate record.</p>
              </div>
            </div>

            <div className="delete-modal-target">
              <strong>{profileToDelete.personal_info.full_name || 'Unnamed Candidate'}</strong>
              <span>ID: {profileToDelete.profile_id}</span>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setProfileToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={confirmDelete}
              >
                <Trash2 size={14} /> Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profiles List */}
      {profiles.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '3.5rem 1.5rem' }}>
          <Users size={40} strokeWidth={1.5} color="var(--primary-light)" />
          <h4 style={{ fontSize: '1.15rem' }}>No Saved Profiles in Local Storage</h4>
          <p style={{ maxWidth: '460px' }}>
            No candidate records have been saved yet. You can create a new profile, import an existing RADIX JSON file,
            or load our sample verified candidate.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={onCreateNew}>
              <Plus size={14} /> Create New Profile
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenImportModal}>
              <UploadCloud size={14} color="#38bdf8" /> Import Profile JSON
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onLoadSample}>
              <Sparkles size={14} color="#38bdf8" /> Load Sample Candidate
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-cards-grid">
          {profiles.map((cand) => {
            const isActive = cand.profile_id === activeProfileId;
            const completion = calculateProfileCompletion(cand);
            const fullName = cand.personal_info.full_name.trim() || 'Untitled Candidate';
            const headline = cand.personal_info.headline.trim() || 'No headline specified';
            const skillCount = cand.skills.length;
            const projectCount = cand.projects.length;

            return (
              <div
                key={cand.profile_id}
                className={`profile-manage-card ${isActive ? 'is-active-profile' : ''}`}
              >
                <div className="profile-card-top">
                  <div className="profile-card-identity">
                    <div className="profile-avatar-small">
                      {fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 className="profile-cand-name">{fullName}</h4>
                        {isActive && (
                          <span className="active-profile-pill">
                            <CheckCircle2 size={11} /> Active in Editor
                          </span>
                        )}
                      </div>
                      <p className="profile-cand-headline">{headline}</p>
                    </div>
                  </div>

                  <div
                    className="profile-readiness-chip"
                    style={{
                      color:
                        completion.overallScore >= 80
                          ? '#10b981'
                          : completion.overallScore >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    <span>{completion.overallScore}% Ready</span>
                  </div>
                </div>

                <div className="profile-stats-row">
                  <span className="profile-stat-item">
                    <Layers size={13} /> {skillCount} RADIX Skill{skillCount === 1 ? '' : 's'}
                  </span>
                  <span className="profile-stat-item">
                    <Calendar size={13} /> {formatDate(cand.last_updated)}
                  </span>
                  {projectCount > 0 && (
                    <span className="profile-stat-item">
                      {projectCount} Project{projectCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <div className="profile-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onExportProfile(cand)}
                    title="Export candidate JSON file"
                  >
                    <Download size={14} color="#38bdf8" /> Export
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onPreviewProfile(cand)}
                    title="Quick preview"
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectProfile(cand.profile_id)}
                    title="Open in editor"
                  >
                    <Edit3 size={14} /> {isActive ? 'Continue' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    onClick={() => setProfileToDelete(cand)}
                    title="Delete profile"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
