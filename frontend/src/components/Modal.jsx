import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui';

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close backdrop"
        className="absolute inset-0 bg-black/45 backdrop-blur-[3px] transition"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex max-h-[92dvh] w-full animate-[fadeUp_0.24s_cubic-bezier(0.22,1,0.36,1)] flex-col rounded-t-2xl border border-white/40 bg-white shadow-[0_24px_64px_-12px_rgba(16,12,8,0.35)] sm:rounded-2xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-gray-200 sm:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4">
          <h2 className="text-[1.08rem] font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl bg-[#f4f3f1] text-[#667085] transition hover:bg-[#ebe9e6] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-3">
          <div className="space-y-3.5">{children}</div>
        </div>
        {footer ? (
          <div className="border-t border-[var(--color-border)] bg-[#fafaf8]/90 px-4 py-3.5 sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Save', loading, destructive }) {
  return (
    <div className="flex w-full gap-2">
      <Button variant="secondary" onClick={onCancel} className="min-w-0 flex-1 sm:flex-none">
        Cancel
      </Button>
      <Button
        variant={destructive ? 'danger' : 'primary'}
        onClick={onConfirm}
        loading={loading}
        className={`min-w-0 flex-[1.4] sm:flex-none ${
          destructive
            ? '!border-transparent !bg-[var(--color-danger)] !text-white hover:!bg-red-800'
            : ''
        }`}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
