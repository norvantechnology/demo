import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: {
    bar: 'bg-[var(--color-success)]',
    icon: 'text-[var(--color-success)]',
    ring: 'ring-emerald-100',
  },
  error: {
    bar: 'bg-[var(--color-danger)]',
    icon: 'text-[var(--color-danger)]',
    ring: 'ring-red-100',
  },
  info: {
    bar: 'bg-[var(--color-info)]',
    icon: 'text-[var(--color-info)]',
    ring: 'ring-blue-100',
  },
  warning: {
    bar: 'bg-[var(--color-warning)]',
    icon: 'text-[var(--color-warning)]',
    ring: 'ring-amber-100',
  },
};

const DEFAULT_DURATION = 4200;

function ToastItem({ toast, onClose }) {
  const Icon = ICONS[toast.type] || Info;
  const style = STYLES[toast.type] || STYLES.info;
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onClose(toast.id), 180);
  }, [onClose, toast.id]);

  useEffect(() => {
    if (toast.duration === 0) return undefined;
    timerRef.current = window.setTimeout(dismiss, toast.duration ?? DEFAULT_DURATION);
    return () => window.clearTimeout(timerRef.current);
  }, [dismiss, toast.duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-item pointer-events-auto relative flex w-[min(100vw-1.5rem,380px)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-[0_12px_40px_-8px_rgba(16,12,8,0.18),0_2px_8px_rgba(16,12,8,0.06)] ring-1 ${style.ring} ${
        leaving ? 'toast-out' : 'toast-in'
      }`}
    >
      <div className={`w-1 shrink-0 ${style.bar}`} />
      <div className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-3">
        <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${style.icon}`} strokeWidth={2} />
        <div className="min-w-0 flex-1 pt-0.5">
          {toast.title ? (
            <div className="text-[13px] font-bold leading-snug tracking-tight text-[var(--color-text-primary)]">
              {toast.title}
            </div>
          ) : null}
          <div
            className={`text-[13px] font-medium leading-snug text-[var(--color-text-muted)] ${
              toast.title ? 'mt-0.5' : ''
            }`}
          >
            {toast.message}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#98a2b3] transition hover:bg-[#f4f3f1] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = ++idRef.current;
    const entry = {
      id,
      type,
      message: typeof message === 'string' ? message : String(message ?? ''),
      title: opts.title,
      duration: opts.duration,
    };
    setToasts((prev) => [...prev.slice(-4), entry]);
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, opts) => push('success', message, opts),
      error: (message, opts) => push('error', message, opts),
      info: (message, opts) => push('info', message, opts),
      warning: (message, opts) => push('warning', message, opts),
      dismiss: remove,
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed end-3 top-3 z-[200] flex max-h-[calc(100dvh-1.5rem)] flex-col gap-2.5 overflow-y-auto sm:end-5 sm:top-5"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
