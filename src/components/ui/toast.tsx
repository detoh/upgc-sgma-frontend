'use client';

import { useToastStore, Toast } from '@/store/toast-store';

const icons: Record<string, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const styles: Record<string, string> = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  info: 'bg-blue-50 border-blue-500 text-blue-800',
};

const progressStyles: Record<string, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

function ToastItem({ toastItem }: { toastItem: Toast }) {
  const { removeToast } = useToastStore();

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-lg border-l-4 p-4 min-w-[320px] max-w-md animate-slide-in ${styles[toastItem.type]}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icons[toastItem.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toastItem.title}</p>
          {toastItem.message && (
            <p className="text-xs mt-1 opacity-80">{toastItem.message}</p>
          )}
        </div>
        <button
          onClick={() => removeToast(toastItem.id)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          ×
        </button>
      </div>
      {/* Barre de progression animée */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${progressStyles[toastItem.type]} animate-progress`}
      />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} toastItem={toastItem} />
      ))}
    </div>
  );
}