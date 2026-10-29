import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  extractJdFromFile,
  extractJdFromText,
  type JDExtractionResponse,
} from '../features/profile-builder/services/jdAnalyzerService';
import type { AppViewId } from '../components/navigation/Sidebar';

interface JdAnalyzerViewProps {
  activeJd: JDExtractionResponse | null;
  onSetActiveJd: (jd: JDExtractionResponse) => void;
  onNavigate: (view: AppViewId) => void;
}

const SAMPLE_JDS = [
  {
    title: 'Senior Cloud & DevOps Engineer',
    company: 'Accenture plc',
    role: 'Senior DevOps Architect',
    text: `Job Title: Senior Cloud & DevOps Engineer
Company: Accenture plc
Location: Bengaluru / Remote

About the Role:
We are seeking an experienced Senior DevOps and Cloud Infrastructure Engineer. You will design, build, and maintain enterprise Kubernetes clusters, architect zero-downtime CI/CD pipelines, and implement infrastructure as code across multi-cloud environments.

Required Qualifications & Skills:
- 4+ years of hands-on experience orchestrating Kubernetes and Docker containerized systems.
- Strong proficiency with Terraform, AWS CloudFormation, or Ansible for Infrastructure as Code (IaC).
- Production expertise in Python and Shell scripting for system automation and reliability engineering.
- Deep understanding of Computer Networking: TCP/IP, DNS, SSL/TLS certificates, load balancers, and VPC peering.
- Hands-on experience configuring PostgreSQL or MySQL databases, query performance tuning, and backup strategies.
- Strong commitment to Agile development, continuous deployment, and enterprise software engineering best practices.`,
  },
  {
    title: 'Systems & Backend Software Engineer',
    company: 'Google LLC',
    role: 'Backend Systems Engineer',
    text: `Job Title: Backend Systems Engineer
Company: Google LLC
Location: Hyderabad / Mountain View

Overview:
We are looking for a Software Engineer to work on core distributed systems infrastructure. You will develop low-latency backend services, optimize data throughput, and solve hard algorithmic challenges.

Core Requirements:
- Expert-level coding skills in C++, Go, or Java.
- Mastery of Data Structures and Algorithms (graphs, trees, dynamic programming, sorting).
- Strong command of Operating Systems concepts: multithreading, concurrency control, IPC, and Linux kernel fundamentals.
- In-depth understanding of System Design and architecture for high-concurrency, distributed web applications.
- Experience with distributed key-value stores (Redis, Memcached) and relational databases (SQL).
- Excellent technical communication and collaboration skills.`,
  },
];

export const JdAnalyzerView: React.FC<JdAnalyzerViewProps> = ({
  activeJd,
  onSetActiveJd,
  onNavigate,
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [jdText, setJdText] = useState(SAMPLE_JDS[0].text);
  const [company, setCompany] = useState(SAMPLE_JDS[0].company);
  const [role, setRole] = useState(SAMPLE_JDS[0].role);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<JDExtractionResponse | null>(activeJd);

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.md'];
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMessage(`Unsupported file format "${ext}". Please upload a .pdf, .docx, or .txt document.`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMessage(`File is too large (${(f.size / (1024 * 1024)).toFixed(1)} MB). Limit is 10 MB.`);
      return;
    }
    setSelectedFile(f);
    // Clear company and role so backend auto-detects true values from file
    setCompany('');
    setRole('');
    setErrorMessage(null);
  };

  const handleLoadSampleFile = (sample: (typeof SAMPLE_JDS)[0]) => {
    setInputMode('file');
    const blob = new Blob([sample.text], { type: 'text/plain' });
    const file = new File([blob], `${sample.company} - ${sample.role}.txt`, { type: 'text/plain' });
    setSelectedFile(file);
    setCompany(sample.company);
    setRole(sample.role);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result: JDExtractionResponse;

      if (inputMode === 'file') {
        if (!selectedFile) {
          throw new Error('Please select a PDF, DOCX, or TXT file to analyze.');
        }
        const comp = company.trim() ? company.trim() : undefined;
        const r = role.trim() ? role.trim() : undefined;
        result = await extractJdFromFile(selectedFile, comp, r);
      } else {
        if (!jdText.trim()) {
          throw new Error('Please paste or type job description text.');
        }
        result = await extractJdFromText(jdText, company.trim() || undefined, role.trim() || undefined);
      }

      setSuccessResult(result);
      if (result.company) setCompany(result.company);
      if (result.role) setRole(result.role);
      onSetActiveJd(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'JD analysis failed';
      setErrorMessage(
        `${msg}. Please ensure Module 1 is running on port 8020 (Offline Heuristic mode).`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sample: (typeof SAMPLE_JDS)[0]) => {
    setInputMode('text');
    setJdText(sample.text);
    setCompany(sample.company);
    setRole(sample.role);
    setErrorMessage(null);
  };

  return (
    <div className="radix-page-content">
      {/* Workspace Header */}
      <div className="workspace-card">
        <div className="workspace-header">
          <div className="workspace-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                MODULE 1 • PORT 8020
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Offline Heuristic & Keyword Taxonomy Engine
              </span>
            </div>
            <h2>Job Description Analyzer</h2>
            <p>
              Extract structured technical requirements, 13 RADIX category codes, and verbatim evidence quotes.
            </p>
          </div>

          {/* Sample quick-loads */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', alignSelf: 'center' }}>
              Load Sample:
            </span>
            {SAMPLE_JDS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadSample(s)}
                className="radix-btn radix-btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                type="button"
              >
                {s.role}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metadata Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="jd-role-input">
                Target Role / Job Title
              </label>
              <input
                id="jd-role-input"
                className="naukri-input-box"
                type="text"
                placeholder="e.g. Senior Cloud & DevOps Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="naukri-input-block">
              <label className="naukri-input-label" htmlFor="jd-company-input">
                Hiring Organization / Company
              </label>
              <input
                id="jd-company-input"
                className="naukri-input-box"
                type="text"
                placeholder="e.g. Accenture plc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setInputMode('text')}
              className={`radix-btn ${inputMode === 'text' ? 'radix-btn-primary' : 'radix-btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              type="button"
            >
              <FileText size={14} />
              <span>Job Description Text</span>
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`radix-btn ${inputMode === 'file' ? 'radix-btn-primary' : 'radix-btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              type="button"
            >
              <UploadCloud size={14} />
              <span>Upload Document (PDF/DOCX/TXT)</span>
            </button>
          </div>

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <div className="naukri-input-block">
              <textarea
                className="naukri-input-box"
                rows={10}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.5' }}
                placeholder="Paste the complete job description text here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>
          )}

          {/* File Input Mode */}
          {inputMode === 'file' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileSelect(f);
                }}
                style={{
                  border: isDragging ? '2px dashed #2563eb' : selectedFile ? '2px solid #3b82f6' : '2px dashed #cbd5e1',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: isDragging ? '#eff6ff' : selectedFile ? '#f0fdf4' : '#f8fafc',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const input = document.getElementById('jd-file-upload-input');
                  if (input) (input as HTMLInputElement).click();
                }}
              >
                <UploadCloud
                  size={42}
                  color={selectedFile ? '#16a34a' : isDragging ? '#2563eb' : '#64748b'}
                  style={{ margin: '0 auto 0.75rem auto' }}
                />

                {selectedFile ? (
                  <div>
                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.25rem' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginBottom: '0.75rem' }}>
                      ✓ Ready for analysis ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <label
                        htmlFor="jd-file-upload-input"
                        className="radix-btn radix-btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
                      >
                        Choose Different File
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="radix-btn radix-btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: '#dc2626' }}
                      >
                        Remove File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                      {isDragging ? 'Drop your Job Description file here' : 'Drag & drop your Job Description here, or click to browse'}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                      Supports .pdf, .docx, and .txt documents up to 10 MB
                    </p>
                    <label
                      htmlFor="jd-file-upload-input"
                      className="radix-btn radix-btn-primary"
                      style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Browse Files
                    </label>
                  </div>
                )}

                <input
                  id="jd-file-upload-input"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.rtf,.md"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Sample Files Helper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.25rem 0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Or test with a sample file:</span>
                {SAMPLE_JDS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadSampleFile(s)}
                    className="radix-btn radix-btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                  >
                    📄 {s.role} ({s.company}.txt)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
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

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="radix-btn radix-btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Extracting Requirements...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyze Job Requirements</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {successResult && (
        <div className="workspace-card">
          <div className="workspace-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                  EXTRACTION COMPLETE
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {successResult.role || 'Job Description Requirements'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Company: <strong>{successResult.company || 'Not specified'}</strong> • Source:{' '}
                {successResult.source_file || 'Direct text'} • Extracted Skills:{' '}
                <strong>{successResult.skills?.length || 0}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => onNavigate('skill-match')}
                className="radix-btn radix-btn-primary"
                type="button"
              >
                <span>Proceed to Skill Match</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Extracted Skills Table */}
          <div className="radix-table-wrapper">
            <table className="radix-table">
              <thead>
                <tr>
                  <th>Skill Name</th>
                  <th>Category Code</th>
                  <th>Confidence</th>
                  <th>Verbatim Evidence Quote</th>
                </tr>
              </thead>
              <tbody>
                {successResult.skills?.map((sk, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{sk.skill_name}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        {sk.category_code}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            sk.confidence === 'high'
                              ? '#f0fdf4'
                              : sk.confidence === 'medium'
                                ? '#fffbeb'
                                : '#f8fafc',
                          color:
                            sk.confidence === 'high'
                              ? '#16a34a'
                              : sk.confidence === 'medium'
                                ? '#d97706'
                                : '#64748b',
                        }}
                      >
                        {sk.confidence || 'verified'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>
                      "{sk.evidence_quote || 'Mentioned in requirements'}"
                    </td>
                  </tr>
                ))}
                {(!successResult.skills || successResult.skills.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No skills extracted from this job description.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
