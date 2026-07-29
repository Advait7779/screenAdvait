import React, { useEffect, useState } from 'react';
import { LogOut, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = 'Sign out of ScreenAdvait?',
  description = 'You can sign in again whenever you need to access the portal.',
}: ConfirmDialogProps) {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setRender(true);
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, open]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-300 ease-out ${
        visible ? 'bg-slate-950/45 backdrop-blur-[3px] opacity-100' : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-dialog-title"
      onMouseDown={onCancel}
    >
      <div
        className={`w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out transform ${
          visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-3'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-red-100 bg-red-50">
            <LogOut className="h-4 w-4 text-red-600" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          <h2 id="sign-out-dialog-title" className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
