import type { CandidateProfile } from '../features/profile-builder/types';

export const createEmptyProfile = (): CandidateProfile => ({
  schema_version: '1.0.0',
  profile_id: `radix-cand-${Date.now().toString(36)}`,
  last_updated: new Date().toISOString(),
  personal_info: {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    links: {
      linkedin: '',
      github: '',
      portfolio: '',
      other: '',
    },
  },
  preferred_roles: {
    target_roles: [],
    job_types: [],
    preferred_locations: [],
    expected_salary_currency: 'USD',
    expected_salary_range: '',
    notice_period_days: undefined,
  },
  education: [],
  skills: [],
  projects: [],
  internships_and_experience: [],
  certifications: [],
});

export const SAMPLE_CANDIDATE_PROFILE: CandidateProfile = {
  schema_version: '1.0.0',
  profile_id: 'radix-cand-sample-2026',
  last_updated: '2026-10-25T00:30:00.000Z',
  personal_info: {
    full_name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA (Open to Remote)',
    headline: 'Senior Full Stack Engineer & Distributed Systems Specialist',
    summary:
      'Full-stack software engineer with 5+ years of experience designing scalable web applications, real-time distributed pipelines, and cloud-native microservices. Passionate about rigorous algorithmic optimization, type safety, and verifiable system resilience.',
    links: {
      linkedin: 'https://linkedin.com/in/alexrivera-sample',
      github: 'https://github.com/alexrivera-sample',
      portfolio: 'https://alexrivera.dev',
      other: 'https://leetcode.com/alexrivera',
    },
  },
  preferred_roles: {
    target_roles: ['Senior Full Stack Engineer', 'Distributed Systems Engineer', 'Technical Lead'],
    job_types: ['full-time', 'remote'],
    preferred_locations: ['San Francisco, CA', 'New York, NY', 'Remote (Global)'],
    expected_salary_currency: 'USD',
    expected_salary_range: '$160,000 - $190,000',
    notice_period_days: 14,
  },
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science & Data Engineering',
      start_year: '2018',
      end_year: '2022',
      gpa_or_grade: '3.86 / 4.00',
      highlights:
        'Dean\'s Honors List, Teaching Assistant for CS61B (Data Structures), Lead organizer for CalHacks.',
    },
  ],
  skills: [
    {
      id: 'sk-1',
      skill_name: 'TypeScript & React',
      category_code: 'COD',
      evidence:
        'Architected high-throughput client dashboard handling 50k+ daily telemetry metrics with zero strict-mode type escapes: github.com/alexrivera-sample/telemetry-ui',
      confidence: 'high',
    },
    {
      id: 'sk-2',
      skill_name: 'Advanced Graph Algorithms & Dynamic Programming',
      category_code: 'DSA',
      evidence:
        'Competitive programming finalist (Top 1.5% globally); solved 600+ algorithmic problems covering topological DAGs, flow networks, and DP: leetcode.com/alexrivera',
      confidence: 'high',
    },
    {
      id: 'sk-3',
      skill_name: 'Distributed Systems & Event-Driven Architecture',
      category_code: 'SYSD',
      evidence:
        'Designed idempotent Apache Kafka event bus processing 12,000 events/sec with partition-level failover and raft consensus.',
      confidence: 'high',
    },
    {
      id: 'sk-4',
      skill_name: 'PostgreSQL Query Optimization & Sharding',
      category_code: 'SQL',
      evidence:
        'Optimized slow queries by introducing partial B-Tree indices and connection pooling, reducing p99 latency from 1.2s to 45ms.',
      confidence: 'medium',
    },
    {
      id: 'sk-5',
      skill_name: 'Kubernetes & Docker Orchestration',
      category_code: 'CLOUD',
      evidence:
        'Authored Helm charts and ArgoCD GitOps pipelines deploying multi-region zero-downtime microservices to AWS EKS.',
      confidence: 'medium',
    },
    {
      id: 'sk-6',
      skill_name: 'Vector Embeddings & RAG Pipelines',
      category_code: 'AI',
      evidence:
        'Built enterprise semantic search engine using pgvector and LangChain with hybrid BM25 re-ranking achieving 0.89 MRR.',
      confidence: 'medium',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'AetherFlow — Real-Time Stream Analytics Engine',
      role: 'Lead Architect & Core Contributor',
      description:
        'An open-source distributed telemetry stream processing engine with visual DAG builder, backpressure monitoring, and sub-millisecond alerting.',
      technologies: ['TypeScript', 'Rust', 'WebSockets', 'Apache Kafka', 'React', 'Docker'],
      live_url: 'https://aetherflow-demo.example.com',
      repo_url: 'https://github.com/alexrivera-sample/aetherflow',
      start_date: '2023-01',
      end_date: '2024-03',
      highlights: [
        'Benchmarked to sustain 45,000 incoming telemetry records per second across a 3-node cluster.',
        'Created custom WebGL-rendered DAG node graph component capable of rendering 1,000 active nodes at 60 FPS.',
        'Adopted by 3 enterprise dev teams for staging cluster health monitoring.',
      ],
    },
    {
      id: 'proj-2',
      title: 'LexiconAI — Autonomous Legal Document Classifier',
      role: 'Full Stack AI Engineer',
      description:
        'Enterprise document extraction pipeline classifying clause risk in contract PDFs using quantized LLM inference and strict JSON schema validation.',
      technologies: ['Python', 'FastAPI', 'React', 'TypeScript', 'Tailwind', 'PostgreSQL'],
      live_url: 'https://lexicon-ai.example.com',
      repo_url: 'https://github.com/alexrivera-sample/lexicon-ai',
      start_date: '2024-04',
      end_date: '2024-11',
      highlights: [
        'Reduced contract review turnaround time from 4 days to 18 minutes with 96.4% classification accuracy.',
        'Built strict hallucination-guard validation layer parsing structured outputs without schema failure.',
      ],
    },
  ],
  internships_and_experience: [
    {
      id: 'exp-1',
      company: 'ScaleGrid Systems',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      start_date: '2023-06',
      end_date: '',
      is_current: true,
      description:
        'Lead core frontend architecture and streaming data tier for cloud database automation platform. Direct a team of 4 engineers building enterprise control planes.',
      technologies: ['TypeScript', 'React', 'Go', 'Kubernetes', 'GraphQL', 'AWS'],
    },
    {
      id: 'exp-2',
      company: 'Nexus Infotech Solutions',
      title: 'Software Engineer',
      location: 'San Jose, CA',
      start_date: '2021-08',
      end_date: '2023-05',
      is_current: false,
      description:
        'Engineered responsive web applications and REST APIs for fintech clients. Automated test coverage to 92% and reduced production bug escape rate by 34%.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Jest'],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      issue_date: '2023-05',
      expiration_date: '2026-05',
      credential_id: 'AWS-SAA-8392014',
      credential_url: 'https://aws.amazon.com/verification/AWS-SAA-8392014',
    },
    {
      id: 'cert-2',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation (CNCF)',
      issue_date: '2024-02',
      expiration_date: '2027-02',
      credential_id: 'CKA-992381-AR',
      credential_url: 'https://www.cncf.io/certification/cka/',
    },
  ],
};
