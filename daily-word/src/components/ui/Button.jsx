import React from 'react';

const variants = {
  primary: 'gradient-brand text-surface-950 font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40',
  secondary: 'bg-surface-800 text-surface-50 border border-surface-700 hover:bg-surface-700',
  ghost: 'bg-transparent text-surface-300 hover:bg-surface-800 hover:text-surface-50',
  danger: 'gradient-danger text-white font-semibold shadow-lg shadow-rose-500/25',
  success: 'gradient-success text-white font-semibold shadow-lg shadow-emerald-500/25',
  outline: 'bg-transparent border-2 border-brand-500 text-brand-400 hover:bg-brand-500/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl',
};

export default function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', icon, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 ease-out btn-press
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="w-5 h-5">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
