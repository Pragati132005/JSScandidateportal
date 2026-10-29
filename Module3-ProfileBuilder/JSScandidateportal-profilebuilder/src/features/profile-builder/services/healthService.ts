/**
 * RADIX Talent Match - Unified Multi-Service Health Monitor
 * Performs concurrent, non-blocking health checks across all RADIX backend services.
 */

import { checkJdAnalyzerHealth } from './jdAnalyzerService';
import { checkResumeParserHealth } from './resumeParserService';
import { checkTalentCheckHealth } from './talentCheckService';
import { checkSkillMatchHealth } from './skillMatchService';
import { checkProfileBackendHealth } from './profileApiService';

export type ServiceStatus = 'healthy' | 'degraded' | 'offline' | 'checking';

export interface ServiceHealthInfo {
  id: string;
  name: string;
  moduleCode: string;
  port: number;
  status: ServiceStatus;
  runtimeMode: string;
  details: string;
  latencyMs?: number;
  lastChecked?: string;
}

export interface SystemHealthReport {
  overallStatus: 'all_healthy' | 'partial_outage' | 'offline';
  services: Record<string, ServiceHealthInfo>;
  timestamp: string;
}

export async function checkAllServices(): Promise<SystemHealthReport> {
  const timestamp = new Date().toISOString();

  // Helper to time execution
  const timeCheck = async <T>(fn: () => Promise<T>): Promise<{ result?: T; latency: number; error?: unknown }> => {
    const start = performance.now();
    try {
      const result = await fn();
      return { result, latency: Math.round(performance.now() - start) };
    } catch (err) {
      return { latency: Math.round(performance.now() - start), error: err };
    }
  };

  const [m1, m2, m4, m5, pb] = await Promise.all([
    timeCheck(checkJdAnalyzerHealth),
    timeCheck(checkResumeParserHealth),
    timeCheck(checkTalentCheckHealth),
    timeCheck(checkSkillMatchHealth),
    timeCheck(checkProfileBackendHealth),
  ]);

  const services: Record<string, ServiceHealthInfo> = {
    module1: {
      id: 'module1',
      name: 'JD Analyzer',
      moduleCode: 'Role 1',
      port: 8020,
      status: m1.result?.status === 'healthy' ? 'healthy' : 'offline',
      runtimeMode: m1.result?.provider || 'Heuristic Fallback Mode',
      details: m1.result ? `Active (${m1.result.provider || 'Heuristic'})` : 'Backend service unreachable on port 8020',
      latencyMs: m1.latency,
      lastChecked: timestamp,
    },
    module2: {
      id: 'module2',
      name: 'Resume Parser',
      moduleCode: 'Role 2',
      port: 8000,
      status: m2.result?.status === 'healthy' ? 'healthy' : 'offline',
      runtimeMode: m2.result?.llm_mode ? `LLM Mode: ${m2.result.llm_mode}` : 'Replay / Fallback Mode',
      details: m2.result ? `Healthy (${m2.result.llm_mode || 'replay'} mode)` : 'Backend service unreachable on port 8000',
      latencyMs: m2.latency,
      lastChecked: timestamp,
    },
    module3: {
      id: 'module3',
      name: 'Profile Builder',
      moduleCode: 'Role 3',
      port: 5173,
      status: 'healthy',
      runtimeMode: 'React 19 + TypeScript + LocalStorage',
      details: 'Frontend app shell & client-side profile persistence operational',
      latencyMs: 0,
      lastChecked: timestamp,
    },
    module4: {
      id: 'module4',
      name: 'Talent Check',
      moduleCode: 'Role 4',
      port: 8010,
      status: m4.result?.status === 'ok' ? 'healthy' : 'offline',
      runtimeMode: 'Local CSV Benchmark Mode',
      details: m4.result ? 'Benchmark dataset loaded (Accenture, Google, Amazon, etc.)' : 'Backend service unreachable on port 8010',
      latencyMs: m4.latency,
      lastChecked: timestamp,
    },
    module5: {
      id: 'module5',
      name: 'Skill Match',
      moduleCode: 'Role 5',
      port: 8030,
      status: m5.result?.status === 'healthy' ? 'healthy' : 'offline',
      runtimeMode: 'Deterministic Matching Engine',
      details: m5.result ? 'Deterministic scoring & fuzzy evidence matcher online' : 'Backend service unreachable on port 8030',
      latencyMs: m5.latency,
      lastChecked: timestamp,
    },
    profileBackend: {
      id: 'profileBackend',
      name: 'Profile Backend',
      moduleCode: 'Storage',
      port: 8040,
      status: pb.result?.status === 'healthy' ? 'healthy' : 'offline',
      runtimeMode: pb.result?.database === 'connected' ? 'PostgreSQL (Supabase Live)' : 'Local Storage Mode',
      details: pb.result ? `Database: ${pb.result.database || 'connected'}` : 'Profile backend unreachable on port 8040',
      latencyMs: pb.latency,
      lastChecked: timestamp,
    },
  };

  const offlineCount = Object.values(services).filter((s) => s.status === 'offline').length;
  const overallStatus = offlineCount === 0 ? 'all_healthy' : offlineCount < 4 ? 'partial_outage' : 'offline';

  return {
    overallStatus,
    services,
    timestamp,
  };
}
