import React, { useState } from 'react';
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { parseResumeFile } from '../features/profile-builder/services/resumeParserService';
import {
  validateModule2Output,
  mapModule2OutputToParsedResumeInput,
  extractModule2Metadata,
  PRIYA_MENON_PARSED_OUTPUT,
  type ParsedResumeInput,
} from '../features/profile-builder/services/resumeAdapter';
import type { Module2Metadata, Module2ParserOutput } from '../features/profile-builder/types';
import type { AppViewId } from '../components/navigation/Sidebar';


interface ResumeParserViewProps {
  onIntakeCandidate: (
    parsed: ParsedResumeInput,
    filename: string,
    metadata?: Module2Metadata | null
  ) => void;
  onNavigate: (view: AppViewId) => void;
}

export const ResumeParserView: React.FC<ResumeParserViewProps> = ({
  onIntakeCandidate,
  onNavigate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parserOutput, setParserOutput] = useState<Module2ParserOutput | null>(null);
  const [parsedMetadata, setParsedMetadata] = useState<Module2Metadata | null>(null);
  const [parsedInput, setParsedInput] = useState<ParsedResumeInput | null>(null);

  const handleParseFile = async (fileToParse?: File) => {
    const file = fileToParse || selectedFile;
    if (!file) {
      setErrorMessage('Please select a PDF or DOCX resume document first.');
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const output = await parseResumeFile(file);
      const validation = validateModule2Output(output);
      if (!validation.isValid) {
        throw new Error(`Module 2 response validation failed: ${validation.errors.join('; ')}`);
      }

      const input = mapModule2OutputToParsedResumeInput(output);
      const meta = extractModule2Metadata(output);

      setParserOutput(output);
      setParsedInput(input);
      setParsedMetadata(meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Parsing error';
      setErrorMessage(`${msg}. Ensure Module 2 is running on port 8000.`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadPriyaFixture = () => {
    const output = PRIYA_MENON_PARSED_OUTPUT;
    const input = mapModule2OutputToParsedResumeInput(output);
    const meta = extractModule2Metadata(output);

    setParserOutput(output);
    setParsedInput(input);
    setParsedMetadata(meta);
    setErrorMessage(null);
  };

  const handleApplyToProfileBuilder = () => {
    if (!parsedInput) return;
    const filename = parserOutput?.source_file || selectedFile?.name || 'parsed_resume.pdf';
    onIntakeCandidate(parsedInput, filename, parsedMetadata);
    onNavigate('profile-builder');
  };

  return (
    <div className="radix-page-content">
      {/* Header Card */}
      <div className="workspace-card">
        <div className="workspace-header">
          <div className="workspace-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#0284c7',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                MODULE 2 • PORT 8000
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Replay / LLM Information Extraction Pipeline
              </span>
            </div>
            <h2>Resume Parser Workspace</h2>
            <p>
              Upload candidate resumes (PDF or DOCX), verify structured fields, inspect provenance warnings, and intake into Profile Builder.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleLoadPriyaFixture}
              className="radix-btn radix-btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              type="button"
            >
              Load Priya Menon Fixture
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <UploadCloud size={44} color="#0284c7" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.25rem' }}>
            {selectedFile ? selectedFile.name : 'Upload Candidate Resume'}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Supports PDF and DOCX files up to 5 MB
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setSelectedFile(f);
                  handleParseFile(f);
                }
              }}
            />
            <label
              htmlFor="resume-file-input"
              className="radix-btn radix-btn-secondary"
              style={{ cursor: 'pointer' }}
            >
              Browse Files
            </label>
            {selectedFile && (
              <button
                onClick={() => handleParseFile()}
                disabled={isParsing}
                className="radix-btn radix-btn-primary"
                type="button"
              >
                {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isParsing ? 'Parsing Resume...' : 'Parse File'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Structured Output Preview */}
      {parsedInput && (
        <div className="workspace-card">
          <div className="workspace-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                  PARSER OUTPUT READY
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    backgroundColor: '#eff6ff',
                    color: '#0284c7',
                  }}
                >
                  Source: {parserOutput?.source_file || 'Uploaded File'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {parsedInput.full_name || 'Parsed Candidate'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Skills: <strong>{parsedInput.skills?.length || 0}</strong> • Education:{' '}
                <strong>{parsedInput.education?.length || 0}</strong> • Projects:{' '}
                <strong>{parsedInput.projects?.length || 0}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleApplyToProfileBuilder}
                className="radix-btn radix-btn-primary"
                type="button"
              >
                <span>Send to Profile Builder</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Provenance Warnings if any */}
          {parsedMetadata?.parse_warnings && parsedMetadata.parse_warnings.length > 0 && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '0.82rem',
              }}
            >
              <strong>Parsing Warnings:</strong> {parsedMetadata.parse_warnings.join('; ')}
            </div>
          )}

          {/* Skills Breakdown */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              Extracted Skills & Grounding
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {parsedInput.skills?.map((sk, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{sk.name}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.05rem 0.35rem',
                      borderRadius: '9999px',
                      backgroundColor: '#eff6ff',
                      color: '#0284c7',
                    }}
                  >
                    {sk.categoryHint || 'OTHER'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: sk.confidence === 'high' ? '#16a34a' : '#d97706',
                      fontWeight: 600,
                    }}
                  >
                    {sk.confidence || 'verified'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathons if present */}
          {parsedMetadata?.hackathons && parsedMetadata.hackathons.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Extracted Hackathons & Competitions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {parsedMetadata.hackathons.map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.82rem',
                    }}
                  >
                    <strong>{h.title || 'Untitled Hackathon'}</strong>
                    {h.description && <span style={{ color: '#475569' }}> — {h.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
