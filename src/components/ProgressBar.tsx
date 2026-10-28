import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  subtext?: string;
  showPercentText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label = 'Profile Completion',
  subtext,
  showPercentText = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const getColor = (pct: number) => {
    if (pct < 40) return '#ef4444'; // Red
    if (pct < 75) return '#f59e0b'; // Amber
    if (pct < 95) return '#0ea5e9'; // Cyan
    return '#10b981'; // Emerald
  };

  const currentColor = getColor(clamped);

  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        {showPercentText && (
          <span className="progress-bar-percent" style={{ color: currentColor }}>
            {clamped}%
          </span>
        )}
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: currentColor,
            boxShadow: `0 0 10px ${currentColor}55`,
          }}
        />
      </div>
      {subtext && <div className="progress-subtext">{subtext}</div>}
    </div>
  );
};
