import React from 'react';

const colorMap = {
  brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  neutral: 'bg-surface-700/50 text-surface-300 border-surface-600/50',
};

export default function Badge({ children, color = 'brand', icon, className = '' }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      border ${colorMap[color]} ${className}
    `}>
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </span>
  );
}
