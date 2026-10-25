import type { RadixCategoryCode } from '../features/profile-builder/types';

export interface RadixCategoryMeta {
  code: RadixCategoryCode;
  label: string;
  categoryName: string;
  description: string;
  color: string;
  badgeBg: string;
}

export const RADIX_CATEGORIES_METADATA: Record<RadixCategoryCode, RadixCategoryMeta> = {
  COD: {
    code: 'COD',
    label: 'COD',
    categoryName: 'Coding & Scripting',
    description: 'Core programming languages, syntax mastery, scripting, and idiomatic coding.',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
  },
  DSA: {
    code: 'DSA',
    label: 'DSA',
    categoryName: 'Data Structures & Algorithms',
    description: 'Algorithmic efficiency, time/space complexity, core trees, graphs, and dynamic programming.',
    color: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.12)',
  },
  OOD: {
    code: 'OOD',
    label: 'OOD',
    categoryName: 'Object-Oriented Design',
    description: 'SOLID principles, design patterns, domain modeling, and clean encapsulation.',
    color: '#a78bfa',
    badgeBg: 'rgba(167, 139, 250, 0.12)',
  },
  APTI: {
    code: 'APTI',
    label: 'APTI',
    categoryName: 'Quantitative Aptitude',
    description: 'Analytical reasoning, quantitative problem solving, and logical deduction.',
    color: '#f472b6',
    badgeBg: 'rgba(244, 114, 182, 0.12)',
  },
  COMM: {
    code: 'COMM',
    label: 'COMM',
    categoryName: 'Communication & Soft Skills',
    description: 'Technical writing, team collaboration, stakeholder presentation, and articulation.',
    color: '#fb7185',
    badgeBg: 'rgba(251, 113, 133, 0.12)',
  },
  AI: {
    code: 'AI',
    label: 'AI',
    categoryName: 'Artificial Intelligence & ML',
    description: 'Machine learning fundamentals, deep learning, NLP, LLM tooling, and model inference.',
    color: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.12)',
  },
  CLOUD: {
    code: 'CLOUD',
    label: 'CLOUD',
    categoryName: 'Cloud & DevOps',
    description: 'Cloud infrastructure (AWS/GCP/Azure), containerization, CI/CD pipelines, and orchestration.',
    color: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.12)',
  },
  SQL: {
    code: 'SQL',
    label: 'SQL',
    categoryName: 'Databases & SQL',
    description: 'Relational database schema design, indexing, SQL queries, transactions, and NoSQL stores.',
    color: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.12)',
  },
  SWE: {
    code: 'SWE',
    label: 'SWE',
    categoryName: 'Software Engineering Practices',
    description: 'Version control (Git), automated testing, code review standards, and agile delivery.',
    color: '#60a5fa',
    badgeBg: 'rgba(96, 165, 250, 0.12)',
  },
  SYSD: {
    code: 'SYSD',
    label: 'SYSD',
    categoryName: 'System Design & Scalability',
    description: 'Distributed systems, load balancing, caching architectures, and high-availability patterns.',
    color: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.12)',
  },
  NETW: {
    code: 'NETW',
    label: 'NETW',
    categoryName: 'Networking & Security',
    description: 'OSI model, HTTP/HTTPS, WebSockets, DNS, authorization tokens, and web security basics.',
    color: '#4ade80',
    badgeBg: 'rgba(74, 222, 128, 0.12)',
  },
  OS: {
    code: 'OS',
    label: 'OS',
    categoryName: 'Operating Systems & Concurrency',
    description: 'Memory management, multi-threading, processes, system calls, and Linux shell proficiency.',
    color: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.12)',
  },
  OTHER: {
    code: 'OTHER',
    label: 'OTHER',
    categoryName: 'Other Technical Domain',
    description: 'Specialized domain proficiencies, embedded systems, hardware, UI/UX, or niche tools.',
    color: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.12)',
  },
};
