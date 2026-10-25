import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  X,
  Brain,
  FolderGit2,
  GraduationCap,
  Sparkles,
  Copy,
} from 'lucide-react';
import type { CandidateProfile } from '../types';
import { validateImportedCandidateJson, MAX_IMPORT_FILE_SIZE_BYTES } from '../services';

interface ImportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProfiles: CandidateProfile[];
  onConfirmImport: (profile: CandidateProfile, mode: 'create_new' | 'overwrite') => void;
}

export const ImportProfileModal: React.FC<ImportProfileModalProps> = ({
  isOpen,
  onClose,
  existingProfiles,
  onConfirmImport,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [parsedCandidate, setParsedCandidate] = useState<CandidateProfile | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isReading, setIsReading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFileName('');
    setParsedCandidate(null);
    setValidationErrors([]);
    setIsReading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    resetState();

    if (!file.name.toLowerCase().endsWith('.json')) {
      setValidationErrors(['Invalid file type. Only standard .json files are accepted.']);
      return;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      setValidationErrors([
        `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the 5 MB maximum limit.`,
      ]);
      return;
    }

    setSelectedFileName(file.name);
    setIsReading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setIsReading(false);
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setValidationErrors(['Could not read file text content.']);
        return;
      }

      const result = validateImportedCandidateJson(text);
      if (!result.isValid) {
        setValidationErrors(result.errors);
        setParsedCandidate(null);
      } else if (result.profile) {
        setParsedCandidate(result.profile);
        setValidationErrors([]);
      }
    };

    reader.onerror = () => {
      setIsReading(false);
      setValidationErrors(['An error occurred while reading the file from disk.']);
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Check for ID Collision
  const conflictingExistingProfile = parsedCandidate
    ? existingProfiles.find((p) => p.profile_id === parsedCandidate.profile_id)
    : null;

  const handleImportWithNewId = () => {
    if (!parsedCandidate) return;
    const newId = `radix-cand-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const freshProfile: CandidateProfile = {
      ...parsedCandidate,
      profile_id: newId,
      last_updated: new Date().toISOString(),
    };
    onConfirmImport(freshProfile, 'create_new');
    handleClose();
  };

  const handleImportOverwrite = () => {
    if (!parsedCandidate) return;
    const updated: CandidateProfile = {
      ...parsedCandidate,
      last_updated: new Date().toISOString(),
    };
    onConfirmImport(updated, 'overwrite');
    handleClose();
  };

  const handleImportRegular = () => {
    if (!parsedCandidate) return;
    onConfirmImport(parsedCandidate, 'create_new');
    handleClose();
  };

  return (
    <div className="import-modal-overlay">
      <div className="import-modal-card">
        {/* Modal Header */}
        <div className="import-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="import-icon-badge">
              <FileJson size={22} />
            </div>
            <div>
              <h3 className="import-modal-title">Import Candidate Profile JSON</h3>
              <p className="import-modal-subtitle">
                Upload a canonical RADIX Candidate Profile JSON to inspect and import into local storage.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-action-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drag and Drop File Zone */}
        {!parsedCandidate && (
          <div
            className={`file-drop-zone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <div className="drop-zone-icon">
              <UploadCloud size={32} />
            </div>
            <div className="drop-zone-text">
              <span className="drop-zone-cta">Click to browse</span> or drag and drop your candidate JSON
              file here
            </div>
            <span className="drop-zone-hint">
              Supports Canonical RADIX Candidate Schema v1.0.0 (Max 5 MB)
            </span>
            {selectedFileName && (
              <span className="selected-file-pill">
                <FileJson size={13} /> {selectedFileName}
              </span>
            )}
          </div>
        )}

        {isReading && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
            Parsing and validating JSON schema...
          </div>
        )}

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="validation-summary-card" style={{ marginTop: '1rem' }}>
            <div className="validation-summary-title">
              <AlertTriangle size={16} />
              <span>Import Validation Failed:</span>
            </div>
            <ul className="validation-summary-list">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  resetState();
                  fileInputRef.current?.click();
                }}
              >
                Choose Another File
              </button>
            </div>
          </div>
        )}

        {/* Validated Candidate Preview */}
        {parsedCandidate && (
          <div className="import-preview-box">
            <div className="import-preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Schema Validation Passed</span>
              </div>
              <span className="schema-badge">Contract v{parsedCandidate.schema_version}</span>
            </div>

            {/* Candidate Card Summary */}
            <div className="import-cand-summary">
              <div className="profile-card-top">
                <div className="profile-card-identity">
                  <div className="profile-avatar-small">
                    {(parsedCandidate.personal_info.full_name || 'CP').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="profile-cand-name">
                      {parsedCandidate.personal_info.full_name || 'Unnamed Candidate'}
                    </h4>
                    <p className="profile-cand-headline">
                      {parsedCandidate.personal_info.headline || 'No headline specified'}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {parsedCandidate.personal_info.email} • {parsedCandidate.personal_info.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats overview */}
              <div className="import-stats-grid">
                <div className="import-stat-chip">
                  <Brain size={13} color="#38bdf8" />
                  <span>{parsedCandidate.skills.length} RADIX Skills</span>
                </div>
                <div className="import-stat-chip">
                  <FolderGit2 size={13} color="#818cf8" />
                  <span>{parsedCandidate.projects.length} Projects</span>
                </div>
                <div className="import-stat-chip">
                  <GraduationCap size={13} color="#a78bfa" />
                  <span>{parsedCandidate.education.length} Education</span>
                </div>
                <div className="import-stat-chip">
                  <Sparkles size={13} color="#34d399" />
                  <span>{parsedCandidate.certifications.length} Certifications</span>
                </div>
              </div>
            </div>

            {/* Conflict Resolution Banner if Duplicate ID */}
            {conflictingExistingProfile ? (
              <div className="collision-warning-box">
                <div className="collision-header">
                  <AlertTriangle size={18} color="#f59e0b" />
                  <div>
                    <h5 style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                      Duplicate Profile ID Detected
                    </h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      A saved profile with ID <code>{parsedCandidate.profile_id}</code> already belongs to{' '}
                      <strong>{conflictingExistingProfile.personal_info.full_name || 'Candidate'}</strong>.
                    </p>
                  </div>
                </div>

                <div className="collision-options-desc">
                  Choose how you would like to handle this candidate record:
                </div>

                <div className="collision-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleImportWithNewId}
                    title="Generate a fresh stable ID and save as a separate candidate"
                  >
                    <Copy size={14} /> Import as New Profile (Recommended)
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleImportOverwrite}
                    title="Replace the existing candidate record permanently"
                  >
                    Overwrite Existing
                  </button>
                </div>
              </div>
            ) : (
              /* No Collision - Simple Confirm */
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    resetState();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose Different File
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleImportRegular}
                >
                  <CheckCircle2 size={14} /> Confirm &amp; Import Profile
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="import-modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
