import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  ShieldAlert,
  FileJson,
} from 'lucide-react';
import type { CandidateProfile, Module2Metadata } from '../types';
import {
  ANANYA_RAO_PARSED_RESUME,
  SYNTHETIC_PARSED_RESUME,
  PRIYA_MENON_PARSED_RESUME,
  PRIYA_MENON_PARSED_OUTPUT,
  mapParsedResumeToCandidateProfile,
  isModule2ParserOutput,
  validateModule2Output,
  mapModule2OutputToParsedResumeInput,
  extractModule2Metadata,
  type ParsedResumeInput,
} from '../services/resumeAdapter';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: CandidateProfile;
  hasUnsavedChanges: boolean;
  onConfirmPrefill: (
    prefilledProfile: CandidateProfile,
    mode: 'replace' | 'merge',
    rawParsedInput?: ParsedResumeInput
  ) => void;
}

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  hasUnsavedChanges,
  onConfirmPrefill,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentParsedInput, setCurrentParsedInput] = useState<ParsedResumeInput | null>(null);
  const [mappedProfile, setMappedProfile] = useState<CandidateProfile | null>(null);
  const [module2Metadata, setModule2Metadata] = useState<Module2Metadata | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFileName('');
    setSelectedFileSize(0);
    setValidationError(null);
    setCurrentParsedInput(null);
    setMappedProfile(null);
    setModule2Metadata(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const applyParsedInput = (
    parsed: ParsedResumeInput,
    filename: string,
    fileSize: number,
    metadata?: Module2Metadata | null
  ) => {
    setSelectedFileName(filename);
    setSelectedFileSize(fileSize);
    setValidationError(null);
    setCurrentParsedInput(parsed);
    setModule2Metadata(metadata || null);

    // ZERO FABRICATION POLICY:
    // Pure mapping directly from parsed input without copying old profile data
    const prefilled = mapParsedResumeToCandidateProfile(parsed, currentProfile);
    setMappedProfile(prefilled);
  };

 
 const processFile = async (file: File) => {
  resetState();

  const lowerName = file.name.toLowerCase();
  const isJson =
    lowerName.endsWith('.json') || file.type === 'application/json';
  const isPdf =
    lowerName.endsWith('.pdf') || file.type === 'application/pdf';
  const isDocx =
    lowerName.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (!isPdf && !isDocx && !isJson) {
    setValidationError(
      'Invalid document format. Only PDF, DOCX, or parsed resume JSON files are supported.'
    );
    return;
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    setValidationError(
      `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the 5 MB maximum limit.`
    );
    return;
  }

  // Preserve the existing JSON upload functionality.
  if (isJson) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File read error');
        }

        const rawParsed = JSON.parse(text) as unknown;

        if (!rawParsed || typeof rawParsed !== 'object') {
          setValidationError(
            'Uploaded JSON does not contain a valid resume object.'
          );
          return;
        }

        let finalParsedInput: ParsedResumeInput;
        let meta: Module2Metadata | null = null;

        if (isModule2ParserOutput(rawParsed)) {
          const validation = validateModule2Output(rawParsed);

          if (!validation.isValid) {
            setValidationError(
              `Invalid Module 2 parser JSON: ${validation.errors.join('; ')}`
            );
            return;
          }

          finalParsedInput =
            mapModule2OutputToParsedResumeInput(rawParsed);
          meta = extractModule2Metadata(rawParsed);
        } else {
          finalParsedInput = rawParsed as ParsedResumeInput;
        }

        applyParsedInput(finalParsedInput, file.name, file.size, meta);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON';
        setValidationError(`Failed to parse resume JSON: ${msg}`);
      }
    };

    reader.onerror = () => {
      setValidationError('Unable to read the uploaded JSON file.');
    };

    reader.readAsText(file);
    return;
  }

  // Send PDF/DOCX files to the real Module 2 parser API.
  const baseUrl = (
    import.meta.env.VITE_RESUME_PARSER_API_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  setIsParsing(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${baseUrl}/parse-resume`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    const responseText = await response.text();

    let rawOutput: unknown;

    try {
      rawOutput = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Parser returned an invalid response (HTTP ${response.status}).`
      );
    }

    if (!response.ok) {
      const detail =
        typeof rawOutput === 'object' &&
        rawOutput !== null &&
        'detail' in rawOutput
          ? String(rawOutput.detail)
          : response.statusText;

      throw new Error(`Module 2 API error (${response.status}): ${detail}`);
    }

    if (!isModule2ParserOutput(rawOutput)) {
      throw new Error(
        'The Module 2 API response does not match the expected output format.'
      );
    }

    const validation = validateModule2Output(rawOutput);

    if (!validation.isValid) {
      throw new Error(
        `Invalid Module 2 response: ${validation.errors.join('; ')}`
      );
    }

    const parsedInput = mapModule2OutputToParsedResumeInput(rawOutput);
    const meta = extractModule2Metadata(rawOutput);

    applyParsedInput(parsedInput, file.name, file.size, meta);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown parsing error';

    if (err instanceof Error && err.name === 'AbortError') {
      setValidationError(
        'Resume parsing timed out. Check that the Module 2 server is running and try again.'
      );
    } else {
      setValidationError(
        `Resume parsing failed: ${message}. Check that Module 2 is running at ${baseUrl}.`
      );
    }
  } finally {
    clearTimeout(timeoutId);
    setIsParsing(false);
  }
 };


  const handleSelectFixture = (
    fixture: ParsedResumeInput,
    fixtureName: string,
    metadata?: Module2Metadata | null
  ) => {
    resetState();
    applyParsedInput(fixture, fixtureName, 4096, metadata);
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

  const handleConfirmAction = (mode: 'replace' | 'merge') => {
    if (mappedProfile && currentParsedInput) {
      onConfirmPrefill(mappedProfile, mode, currentParsedInput);
      handleClose();
    }
  };

  const hasExistingData = Boolean(
    currentProfile.personal_info.full_name ||
      currentProfile.skills.length > 0 ||
      hasUnsavedChanges
  );

  // Identify fields genuinely missing from the parsed resume
  const missingItems: string[] = [];
  if (mappedProfile) {
    if (!mappedProfile.personal_info.email) missingItems.push('Email Address');
    if (!mappedProfile.personal_info.phone) missingItems.push('Phone Number');
    if (!mappedProfile.personal_info.location) missingItems.push('Location / City');
    if (!mappedProfile.personal_info.links.linkedin && !mappedProfile.personal_info.links.github) {
      missingItems.push('Social / Portfolio Links');
    }
    if (mappedProfile.education.some((e) => !e.institution)) missingItems.push('Education Institution');
    if (mappedProfile.education.some((e) => !e.start_year)) missingItems.push('Education Start Year');
    if (mappedProfile.preferred_roles.job_types.length === 0) missingItems.push('Employment Modality (Job Types)');
    if (!mappedProfile.preferred_roles.expected_salary_currency) missingItems.push('Salary Currency & Range');
    if (mappedProfile.preferred_roles.notice_period_days === undefined) missingItems.push('Notice Period');
    if (mappedProfile.certifications.length === 0) missingItems.push('Certifications');
    if (mappedProfile.internships_and_experience.some((e) => !e.company)) {
      missingItems.push('Experience Company Name');
    }
  }

  return (
    <div className="import-modal-overlay">
      <div className="import-modal-card" style={{ maxWidth: '660px' }}>
        {/* Modal Header */}
        <div className="import-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="import-icon-badge"
              style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h3 className="import-modal-title">Prefill from Candidate Resume</h3>
              <p className="import-modal-subtitle">
                Intake candidate resume to prefill extracted credentials. Missing values remain empty.
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

        {/* Offline Engine Notice */}
        <div
          style={{
            margin: '0.85rem 1.5rem 0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '0.82rem',
            lineHeight: 1.45,
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Info size={15} color="#38bdf8" />
            <strong style={{ color: '#38bdf8' }}>Zero-Fabrication Resume Intake Policy</strong>
          </div>
          <span>
            Fields missing from the resume remain strictly blank until explicitly supplied by the candidate.
            Module 2 (Resume Parsing AI) is currently offline for this standalone module; upload a parsed
            resume <code>.json</code> file or test with verified candidate fixtures.
          </span>
        </div>

        {/* Quick Test Fixture Selectors */}
        {!mappedProfile && (
          <div style={{ margin: '0.5rem 1.5rem 0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              QUICK TEST FIXTURES:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectFixture(ANANYA_RAO_PARSED_RESUME, 'Ananya_Rao_Resume.json')}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderColor: '#38bdf8' }}
              >
                <Sparkles size={13} color="#38bdf8" /> Load Ananya Rao (SWE / Systems / DSA)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  handleSelectFixture(
                    PRIYA_MENON_PARSED_RESUME,
                    'priya_menon.parse.json',
                    extractModule2Metadata(PRIYA_MENON_PARSED_OUTPUT)
                  )
                }
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderColor: '#10b981' }}
              >
                <Sparkles size={13} color="#10b981" /> Load Priya Menon (Module 2 Parser)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectFixture(SYNTHETIC_PARSED_RESUME, 'Jordan_Taylor_Resume.json')}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              >
                <FileJson size={13} /> Load Jordan Taylor (Cloud / DevOps)
              </button>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {!mappedProfile && (
          <div
            className={`file-drop-zone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ margin: '0.85rem 1.5rem 1.25rem' }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.json,application/pdf,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <div className="drop-zone-icon">
              <UploadCloud size={30} />
            </div>
            <div className="drop-zone-text">
              <strong>Click to upload</strong> or drag and drop resume file
            </div>
            <div className="drop-zone-hint">
              Supports PDF (.pdf), Word (.docx), or parsed resume JSON (.json) • Max 5 MB
            </div>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div
            className="validation-summary-card"
            style={{ margin: '0.75rem 1.5rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            <div className="validation-summary-title">
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ color: '#ef4444' }}>Resume Validation Failed:</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {validationError}
            </div>
          </div>
        )}

        {/* Extracted Data Preview */}
        {mappedProfile && (
          <div style={{ padding: '0 1.5rem 1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{selectedFileName}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({(selectedFileSize / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={resetState}
              >
                Change File / Candidate
              </button>
            </div>

            {/* Overwrite or Merge Warning */}
            {hasExistingData && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: '0.85rem',
                }}
              >
                <ShieldAlert size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#f59e0b' }}>Active Draft Notice: </strong>
                  Your current editor has active profile data. You can either start a fresh draft
                  from this resume or merge extracted items while preserving your existing manual edits.
                </div>
              </div>
            )}

            {/* Extraction Summary Card */}
            <div className="import-preview-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <Sparkles size={14} color="#38bdf8" />
                <strong style={{ fontSize: '0.85rem' }}>Extracted Candidate Data Preview</strong>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {mappedProfile.personal_info.full_name || 'Unnamed Candidate'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                {mappedProfile.personal_info.headline || 'No headline in resume'}
              </div>

              <div className="import-preview-chips">
                <span className="import-chip">
                  <strong>{mappedProfile.skills.length}</strong> Skills
                </span>
                <span className="import-chip">
                  <strong>{mappedProfile.projects.length}</strong> Projects
                </span>
                <span className="import-chip">
                  <strong>{mappedProfile.internships_and_experience.length}</strong> Experience
                </span>
                <span className="import-chip">
                  <strong>{mappedProfile.education.length}</strong> Education
                </span>
                <span className="import-chip">
                  <strong>{mappedProfile.certifications.length}</strong> Certifications
                </span>
              </div>

              {/* Explicit Missing Fields Notice */}
              {missingItems.length > 0 && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.3rem' }}>
                    <AlertTriangle size={13} />
                    <span>Missing from Resume (Will remain empty for candidate input):</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {missingItems.join(' • ')}
                  </div>
                </div>
              )}

              {/* Module 2 Parser Warnings Notice (Honest Metadata) */}
              {module2Metadata?.parse_warnings && module2Metadata.parse_warnings.length > 0 && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#38bdf8',
                      fontWeight: 600,
                      marginBottom: '0.2rem',
                    }}
                  >
                    <Info size={13} />
                    <span>Module 2 Extraction Warnings (Kept in metadata):</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {module2Metadata.parse_warnings.join(' • ')}
                  </div>
                </div>
              )}

              {/* Extracurricular Items Notice (Preserved in Intake Metadata) */}
              {((module2Metadata?.hackathons && module2Metadata.hackathons.length > 0) ||
                (module2Metadata?.achievements && module2Metadata.achievements.length > 0)) && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#a855f7',
                      fontWeight: 600,
                      marginBottom: '0.2rem',
                    }}
                  >
                    <Info size={13} />
                    <span>Extracurricular Items (Preserved in Intake Metadata):</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {module2Metadata?.hackathons?.map((h) => `Hackathon: ${h.title || 'Untitled'}`).join(' • ')}
                    {module2Metadata?.hackathons &&
                    module2Metadata.hackathons.length > 0 &&
                    module2Metadata?.achievements &&
                    module2Metadata.achievements.length > 0
                      ? ' • '
                      : ''}
                    {module2Metadata?.achievements?.map((a) => `Achievement: ${a}`).join(' • ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="import-modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
            Cancel
          </button>
          {mappedProfile && hasExistingData && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleConfirmAction('merge')}
              title="Keep your explicitly entered fields and merge resume data"
            >
              Merge &amp; Keep My Edits
            </button>
          )}
          {mappedProfile && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleConfirmAction('replace')}
            >
              <Sparkles size={14} /> {hasExistingData ? 'Replace Draft with Resume' : 'Prefill Profile Draft'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
