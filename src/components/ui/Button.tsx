import React from 'react';

export default function Button({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        'inline-flex items-center justify-center px-4 py-2 rounded-2xl text-sm font-medium shadow-sm focus:outline-none ' +
        'bg-indigo-600 text-white hover:bg-indigo-700 ' +
        className
      }
    >
      {children}
    </button>
  );
}
