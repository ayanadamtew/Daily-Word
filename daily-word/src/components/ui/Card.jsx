import React from 'react';

export default function Card({ children, className = '', hover = false, glow = false, ...props }) {
  return (
    <div
      className={`
        glass rounded-2xl p-5
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
