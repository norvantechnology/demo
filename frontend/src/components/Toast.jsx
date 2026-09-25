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

/** Soft tinted surfaces — not plain white */
const STYLES = {
  success: {
    wrap: 'toast-success',
    iconWrap: 'toast-icon-success',
  },
  error: {
    wrap: 'toast-error',
    iconWrap: 'toast-icon-error',
  },
  info: {
    wrap: 'toast-info',
    iconWrap: 'toast-icon-info',
  },
  warning: {
    wrap: 'toast-warning',
    iconWrap: 'toast-icon-warning',
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
    window.setTimeout(() => onClose(toast.id), 200);
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
      className={`toast-item pointer-events-auto ${style.wrap} ${toast.title ? 'has-title' : ''} ${leaving ? 'toast-out' : 'toast-in'}`}
    >
      <span className={`toast-icon ${style.iconWrap}`} aria-hidden>
        <Icon className="toast-icon-svg" strokeWidth={2.25} />
      </span>
      <div className="toast-body">
        {toast.title ? <div className="toast-title">{toast.title}</div> : null}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button type="button" aria-label="Close" onClick={dismiss} className="toast-close">
        <X className="toast-close-svg" strokeWidth={2.25} />
      </button>
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
    setToasts((prev) => [...prev.slice(-3), entry]);
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
      <div className="toast-stack" aria-label="Notifications">
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
