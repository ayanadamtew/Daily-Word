import React from 'react';

export default function CrossIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Vertical beam */}
      <rect x="10" y="2" width="4" height="20" rx="1" fill="url(#crossGrad)" />
      {/* Horizontal beam */}
      <rect x="4" y="7" width="16" height="4" rx="1" fill="url(#crossGrad)" />
      {/* Subtle glow */}
      <rect x="10" y="2" width="4" height="20" rx="1" fill="url(#crossGrad)" opacity="0.3" filter="blur(2px)" />
    </svg>
  );
}
