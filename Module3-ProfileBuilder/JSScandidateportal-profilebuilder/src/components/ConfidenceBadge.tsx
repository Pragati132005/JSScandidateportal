import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import type { SkillConfidence } from '../features/profile-builder/types';

interface ConfidenceBadgeProps {
  confidence: SkillConfidence;
  showIcon?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  showIcon = true,
}) => {
  const config = {
    high: {
      label: 'High Confidence',
      shortLabel: 'High',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(52, 211, 153, 0.3)',
      Icon: ShieldCheck,
    },
    medium: {
      label: 'Medium Confidence',
      shortLabel: 'Medium',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.3)',
      Icon: Shield,
    },
    low: {
      label: 'Low Confidence',
      shortLabel: 'Low',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.25)',
      Icon: ShieldAlert,
    },
  }[confidence] || {
    label: confidence,
    shortLabel: confidence,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.25)',
    Icon: Shield,
  };

  const { color, bg, border, shortLabel, Icon } = config;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.74rem',
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        letterSpacing: '0.01em',
      }}
      title={`Confidence Level: ${confidence}`}
    >
      {showIcon && <Icon size={12} strokeWidth={2.5} />}
      <span>{shortLabel}</span>
    </span>
  );
};
