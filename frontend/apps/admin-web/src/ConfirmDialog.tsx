import React, { useEffect, useRef, useState } from 'react';
import { LogOut, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
}

const tones = {
  danger: { icon: 'border-red-100 bg-red-50 text-red-600', button: 'bg-red-600 hover:bg-red-700' },
  warning: { icon: 'border-amber-100 bg-amber-50 text-amber-700', button: 'bg-amber-600 hover:bg-amber-700' },
  success: { icon: 'border-green-100 bg-green-50 text-green-700', button: 'bg-green-700 hover:bg-green-800' },
  info: { icon: 'border-blue-100 bg-blue-50 text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' },
};

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = 'Sign out of ScreenAdvait?',
  description = 'You can sign in again whenever you need to access the portal.',
  confirmLabel = 'Sign out',
  tone = 'danger',
  icon = <LogOut className="h-4 w-4" />,
}: ConfirmDialogProps) {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(open);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const displayed = useRef({ title, description, confirmLabel, tone, icon });
  if (open) displayed.current = { title, description, confirmLabel, tone, icon };
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

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
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => cancelRef.current?.focus(), 20);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRef.current) onCancelRef.current();
      if (event.key !== 'Tab') return;
      const buttons = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-300 ease-out ${
        visible ? 'bg-slate-950/45 backdrop-blur-[3px] opacity-100' : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={() => { if (!pending) onCancel(); }}
    >
      <div
        ref={dialogRef}
        className={`w-full max-w-sm rounded-lg border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out transform ${
          visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-3'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${tones[displayed.current.tone].icon}`}>
            {displayed.current.icon}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900">
            {displayed.current.title}
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-600">{displayed.current.description}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={pending}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${tones[displayed.current.tone].button}`}
          >
            {pending ? 'Working…' : displayed.current.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
