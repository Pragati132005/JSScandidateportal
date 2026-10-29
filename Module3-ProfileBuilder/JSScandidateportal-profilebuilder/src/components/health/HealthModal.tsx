import React from 'react';
import {
  X,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Cpu,
  Layers,
  FileText,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import type { SystemHealthReport } from '../../features/profile-builder/services/healthService';

interface HealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthReport: SystemHealthReport | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const HealthModal: React.FC<HealthModalProps> = ({
  isOpen,
  onClose,
  healthReport,
  isRefreshing,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'module1':
        return Briefcase;
      case 'module2':
        return FileText;
      case 'module3':
        return UserCheck;
      case 'module4':
        return Cpu;
      case 'module5':
        return Layers;
      case 'profileBackend':
        return Database;
      default:
        return Server;
    }
  };

  const services = healthReport?.services ? Object.values(healthReport.services) : [];
  const healthyCount = services.filter((s) => s.status === 'healthy').length;

  return (
    <div className="import-modal-overlay">
      <div className="import-modal-card" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="import-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="import-icon-badge"
              style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}
            >
              <Server size={20} />
            </div>
            <div>
              <h2 className="import-modal-title">RADIX Service Health & Ports</h2>
              <p className="import-modal-subtitle">
                Real-time connection status across the 5 analysis microservices and Profile Backend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="import-close-btn"
            type="button"
            aria-label="Close health modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="import-modal-body">
          {/* Status summary banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: healthyCount >= 5 ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${healthyCount >= 5 ? '#bbf7d0' : '#fde68a'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {healthyCount >= 5 ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <AlertTriangle size={18} color="#d97706" />
              )}
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                {healthyCount} of {services.length} services currently responsive
              </span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="radix-btn radix-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              type="button"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Checking...' : 'Refresh Pings'}</span>
            </button>
          </div>

          {/* Service grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {services.map((srv) => {
              const Icon = getModuleIcon(srv.id);
              const isHealthy = srv.status === 'healthy';

              return (
                <div
                  key={srv.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563eb',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          {srv.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          Port {srv.port}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                          }}
                        >
                          {srv.moduleCode}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Mode: <span style={{ fontWeight: 600, color: '#475569' }}>{srv.runtimeMode}</span>
                        {srv.latencyMs !== undefined && (
                          <span style={{ marginLeft: '0.75rem' }}>• {srv.latencyMs}ms</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isHealthy ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#16a34a',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          backgroundColor: '#f0fdf4',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Online</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          backgroundColor: '#fef2f2',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid #fecaca',
                        }}
                      >
                        <XCircle size={13} />
                        <span>Offline</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="import-modal-footer">
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Last polled: {healthReport?.timestamp ? new Date(healthReport.timestamp).toLocaleTimeString() : 'Never'}
          </span>
          <button onClick={onClose} className="radix-btn radix-btn-secondary" type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
