import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal content */}
      <div
        className={`
          relative w-full sm:max-w-lg mx-auto
          bg-surface-900 border border-surface-700
          rounded-t-3xl sm:rounded-2xl
          p-6 pb-8
          animate-slide-up
          max-h-[85vh] overflow-y-auto
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-surface-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-surface-50">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
