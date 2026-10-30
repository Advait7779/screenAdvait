import React from 'react';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-gray-200 text-gray-600 hover:bg-gray-100',
  info: 'border-blue-200 text-blue-700 hover:bg-blue-50',
  success: 'border-green-200 text-green-700 hover:bg-green-50',
  warning: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  danger: 'border-red-200 text-red-600 hover:bg-red-50',
};

export function ActionIconButton({ label, tone = 'neutral', onClick, disabled, children }: {
  label: string;
  tone?: Tone;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
