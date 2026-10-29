import React from 'react';
import type { RadixCategoryCode } from '../features/profile-builder/types';
import { RADIX_CATEGORIES_METADATA } from '../data/radixCategories';

interface BadgeProps {
  categoryCode?: RadixCategoryCode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  categoryCode,
  label,
  variant = 'neutral',
  size = 'md',
}) => {
  if (categoryCode && RADIX_CATEGORIES_METADATA[categoryCode]) {
    const meta = RADIX_CATEGORIES_METADATA[categoryCode];
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.6rem',
          borderRadius: '4px',
          fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          backgroundColor: meta.badgeBg,
          color: meta.color,
          border: `1px solid ${meta.color}35`,
          letterSpacing: '0.03em',
        }}
        title={`${meta.categoryName}: ${meta.description}`}
      >
        <span>{meta.code}</span>
        {label && <span style={{ fontWeight: 400, opacity: 0.85 }}>• {label}</span>}
      </span>
    );
  }

  const variantStyles = {
    primary: { bg: 'rgba(14, 165, 233, 0.12)', color: 'var(--primary-light)', border: 'rgba(14, 165, 233, 0.25)' },
    secondary: { bg: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.25)' },
    success: { bg: 'var(--success-bg)', color: 'var(--success)', border: 'rgba(16, 185, 129, 0.3)' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'rgba(245, 158, 11, 0.3)' },
    danger: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: 'rgba(239, 68, 68, 0.3)' },
    neutral: { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' },
  }[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.6rem',
        borderRadius: '4px',
        fontSize: size === 'sm' ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        backgroundColor: variantStyles.bg,
        color: variantStyles.color,
        border: `1px solid ${variantStyles.border}`,
      }}
    >
      {label}
    </span>
  );
};
