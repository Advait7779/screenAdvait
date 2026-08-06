import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Smooth entrance
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Smooth exit before unmounting
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 2800);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 ease-out transform ${
        visible
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-4 opacity-0 scale-95'
      } ${
        isSuccess
          ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
          : isError
          ? 'bg-red-50/95 border-red-200 text-red-900'
          : 'bg-sky-50/95 border-sky-200 text-sky-900'
      }`}
    >
      <div className="shrink-0">
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {isError && <AlertCircle className="w-4 h-4 text-red-600" />}
        {!isSuccess && !isError && <Info className="w-4 h-4 text-sky-600" />}
      </div>
      <span className="text-xs font-semibold whitespace-nowrap">
        {toast.text}
      </span>
    </div>
  );
}
