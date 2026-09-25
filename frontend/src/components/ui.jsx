import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TONE = {
  success: { bg: 'bg-[var(--color-success-bg)]', text: 'text-[var(--color-success)]' },
  warning: { bg: 'bg-[var(--color-warning-bg)]', text: 'text-[var(--color-warning)]' },
  danger: { bg: 'bg-[var(--color-danger-bg)]', text: 'text-[var(--color-danger)]' },
  info: { bg: 'bg-[var(--color-info-bg)]', text: 'text-[var(--color-info)]' },
  neutral: { bg: 'bg-[var(--color-neutral-bg)]', text: 'text-[var(--color-neutral)]' },
};

/** Red reserved for overdue / rejected / blocked only */
const STATUS_TONE = {
  new: 'info',
  in_press: 'warning',
  done: 'success',
  unpaid: 'neutral',
  partial: 'warning',
  paid: 'success',
  overdue: 'danger',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  present: 'success',
  absent: 'danger',
  off: 'neutral',
  active: 'success',
  inactive: 'neutral',
  draft: 'neutral',
};

export function BrandMark({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8 text-[13px]',
    md: 'h-10 w-10 text-[15px]',
    lg: 'h-14 w-14 text-[20px]',
  };
  return (
    <div className={`brand-mark shrink-0 ${sizes[size]} ${className}`} aria-hidden>
      A
    </div>
  );
}

export function StatusPill({ status, label }) {
  const { t } = useTranslation();
  const toneKey = STATUS_TONE[status] || 'neutral';
  const tone = TONE[toneKey];
  const text = label || t(`status.${status}`, { defaultValue: String(status || '').replace(/_/g, ' ') });
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${tone.bg} ${tone.text}`}
    >
      {text}
    </span>
  );
}

export function SectionHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`mb-2.5 ${className}`}>
      <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)] sm:text-base">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="mb-4 space-y-3 sm:mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.35rem] font-extrabold leading-tight tracking-tight sm:text-[1.55rem]">
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-1.5 max-w-2xl text-[12.5px] font-medium leading-relaxed text-[var(--color-text-muted)] sm:text-[13.5px]">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function Toolbar({ children, className = '' }) {
  return (
    <div className={`border-b border-[var(--color-border)] bg-[#faf8f6]/95 px-3 py-3.5 sm:px-4 ${className}`}>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        {children}
      </div>
    </div>
  );
}

/** Labeled filter controls in a responsive grid; inputs share one baseline */
export function FilterBar({ children, className = '' }) {
  return (
    <div
      className={`grid w-full grid-cols-1 items-end gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.8fr)_auto] xl:grid-cols-[minmax(220px,1.2fr)_minmax(170px,0.7fr)_minmax(280px,auto)_auto] ${className}`}
    >
      {children}
    </div>
  );
}

export function Panel({ children, className = '', toolbar }) {
  return (
    <div className={`panel anim-in ${className}`}>
      {toolbar}
      {children}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  label,
  className = '',
}) {
  return (
    <label className={`block min-w-0 w-full ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
          strokeWidth={1.75}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="field-control !ps-9"
        />
      </div>
    </label>
  );
}

export function SoftLink({ to, children, className = '', onClick, ...props }) {
  const cls = `font-semibold text-[var(--color-accent)] transition hover:underline ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`bg-transparent p-0 text-sm ${cls}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

/** No underline - weight + hover color only */
export function TextLink({ to, children, className = '', onClick, ...props }) {
  const cls = `font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)] ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`bg-transparent p-0 text-sm ${cls}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ children, label, className = '', ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  sublabel,
  tone = 'default',
  icon: Icon,
  onClick,
  loading,
  /** denser horizontal row - better for long currency values on narrow screens */
  layout = 'stack',
}) {
  const valueColor =
    tone === 'danger'
      ? 'text-[var(--color-danger)]'
      : tone === 'success'
        ? 'text-[var(--color-success)]'
        : tone === 'warning'
          ? 'text-[var(--color-warning)]'
          : 'text-[var(--color-text-primary)]';

  const iconWrap =
    tone === 'danger'
      ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'
      : tone === 'success'
        ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
        : tone === 'warning'
          ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
          : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]';

  const interactive = onClick
    ? 'cursor-pointer hover:border-[var(--color-accent)]/25 hover:shadow-md active:bg-[#faf8f6] sm:hover:-translate-y-0.5 sm:active:translate-y-0'
    : '';

  if (loading) {
    if (layout === 'row') {
      return (
        <div
          className="anim-in flex min-h-[68px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-3.5 py-3"
          role="status"
          aria-label="Loading"
        >
          <div className="skeleton h-9 w-9 shrink-0 !rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-6 w-20" />
        </div>
      );
    }
    return (
      <div
        className="anim-in grid h-full min-h-[132px] w-full grid-rows-[auto_1fr_auto] gap-0 rounded-2xl border border-[var(--color-border)] bg-white p-4"
        role="status"
        aria-label="Loading"
      >
        <div className="flex h-8 items-center justify-between gap-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-8 shrink-0 !rounded-xl" />
        </div>
        <div className="flex items-end py-2">
          <div className="skeleton h-7 w-24" />
        </div>
        <div className="skeleton h-3 w-28" />
      </div>
    );
  }

  const Comp = onClick ? 'button' : 'div';

  if (layout === 'row') {
    return (
      <Comp
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={`anim-in flex w-full min-h-[68px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-3.5 py-3 text-start shadow-[0_1px_2px_rgba(18,14,10,0.04)] transition duration-200 ${interactive}`}
      >
        <div
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}
          aria-hidden={!Icon}
        >
          {Icon ? <Icon className="h-4 w-4" strokeWidth={1.85} /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {label}
          </div>
          <div className="mt-0.5 min-h-[1rem] truncate text-[11.5px] font-medium leading-none text-[var(--color-text-muted)]">
            {sublabel || '\u00a0'}
          </div>
        </div>
        <div
          className={`max-w-[48%] shrink-0 text-end text-[1.05rem] font-extrabold leading-none tracking-tight sm:text-[1.2rem] ${valueColor}`}
        >
          {value}
        </div>
      </Comp>
    );
  }

  /* Fixed 3-slot stack: header / amount / footer - keeps neighbors aligned in a grid */
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`anim-in grid h-full min-h-[132px] w-full grid-rows-[2rem_minmax(2.5rem,1fr)_1.25rem] gap-y-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-start shadow-[0_1px_2px_rgba(18,14,10,0.04)] transition duration-200 ${interactive}`}
    >
      <div className="flex h-8 items-center justify-between gap-3">
        <div className="text-caption line-clamp-2 min-w-0 flex-1 leading-tight">
          {label}
        </div>
        <div
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            Icon ? iconWrap : 'invisible'
          }`}
          aria-hidden={!Icon}
        >
          {Icon ? <Icon className="h-4 w-4" strokeWidth={1.85} /> : null}
        </div>
      </div>

      <div
        className={`flex min-h-0 items-end overflow-hidden text-[1.35rem] font-extrabold leading-none tracking-tight sm:text-[1.5rem] ${valueColor}`}
      >
        <span className="min-w-0 truncate">{value}</span>
      </div>

      <div className="flex h-5 items-center text-[12px] font-medium leading-none text-[var(--color-text-muted)] sm:text-[12.5px]">
        <span className="truncate">{sublabel || '\u00a0'}</span>
      </div>
    </Comp>
  );
}

export function SegmentedTabs({ options, value, onChange, className = '', loading }) {
  return (
    <div
      role="tablist"
      className={`tabs-scroll relative flex h-[42px] w-full items-stretch rounded-xl bg-[#eceae7] p-1 sm:h-10 sm:w-auto ${className}`}
    >
      {loading ? (
        <div className="loading-bar absolute inset-x-1 top-0 z-10 rounded-full" aria-hidden />
      ) : null}
      {options.map((opt) => {
        const active = opt.value === value;
        const countPending = Boolean(loading) && opt.count == null;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex min-h-0 flex-1 items-center justify-center gap-1 rounded-lg px-2.5 text-[12.5px] font-semibold whitespace-nowrap transition duration-150 sm:flex-none sm:px-3 sm:text-[13px] ${
              active
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="truncate">{opt.label}</span>
            {countPending ? (
              <span
                className={`inline-flex h-4 min-w-[1.1rem] items-center justify-center text-[10px] tabular-nums ${
                  active ? 'text-white/55' : 'text-[#b0a9a1]'
                }`}
                aria-hidden
              >
                <span className="count-pulse">...</span>
              </span>
            ) : opt.count != null ? (
              <span
                className={`tabular-nums ${active ? 'text-white/80' : 'text-[#98a2b3]'}`}
              >
                ({opt.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function CurrencyKwd({ value, className = '' }) {
  const n = Number(value) || 0;
  return (
    <span
      className={`num inline-flex items-baseline gap-x-1 whitespace-nowrap no-underline ${className}`}
      style={{ textDecoration: 'none' }}
    >
      {new Intl.NumberFormat('en-KW', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }).format(n)}
      <span className="text-[0.62em] font-semibold text-[var(--color-text-muted)]">KWD</span>
    </span>
  );
}

export function EmptyState({ icon: Icon, title, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center sm:py-14">
      {Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]">
          <Icon className="h-7 w-7 text-[var(--color-accent)]" strokeWidth={1.5} />
        </div>
      ) : null}
      <p className="max-w-sm text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
      {action}
    </div>
  );
}

export function ErrorBanner({ onRetry, message }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium">{message || t('common.retry')}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-10 self-start rounded-lg bg-white px-3 font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 sm:self-auto"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  loading,
  disabled,
  size = 'md',
  ...props
}) {
  const sizes = {
    sm: 'min-h-8 px-2.5 py-1 text-xs',
    md: 'min-h-10 px-3.5 py-2 text-sm sm:px-4',
  };
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]}`;
  const variants = {
    primary:
      'bg-[var(--color-accent)] text-white shadow-sm shadow-[var(--color-accent)]/20 hover:bg-[#651f30] hover:shadow-md',
    secondary:
      'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] shadow-sm shadow-black/[0.03] hover:border-gray-300 hover:bg-[#fafaf9]',
    danger:
      'border border-red-200 bg-red-50 font-semibold text-[var(--color-danger)] hover:bg-red-100',
    ghost:
      'bg-transparent font-medium text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-primary)]',
  };
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="sr-only">Loading</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function Input({ label, error, hint, icon: Icon, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      {hint ? (
        <span className="mb-1.5 block text-[11.5px] font-medium text-[var(--color-text-muted)]">{hint}</span>
      ) : null}
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
            strokeWidth={1.75}
          />
        ) : null}
        <input
          className={`field-control ${Icon ? 'has-icon' : ''} ${
            error ? '!border-[var(--color-danger)] focus:!shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_16%,transparent)]' : ''
          }`}
          {...props}
        />
      </div>
      {error ? <span className="mt-1 block text-xs font-medium text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}

export function TextArea({ label, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <textarea className="field-control !min-h-[80px] resize-y" rows={3} {...props} />
      {error ? <span className="mt-1 block text-xs font-medium text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <select className="field-control appearance-none pe-9" {...props}>
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs font-medium text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}

export function Card({ children, className = '', title, action, noPadding }) {
  return (
    <div className={`panel anim-in ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-3.5 py-2.5 sm:px-4">
          <h3 className="text-[13px] font-bold tracking-tight sm:text-sm">{title}</h3>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-3 sm:p-4'}>{children}</div>
    </div>
  );
}

export function TableFooter({ page, limit, total }) {
  return (
    <Pagination page={page} limit={limit} total={total} />
  );
}

/** Full pagination controls for list pages (mobile + desktop). */
export function Pagination({
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);
  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;
  const interactive = typeof onPageChange === 'function';

  function go(p) {
    if (!interactive) return;
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== safePage) onPageChange(next);
  }

  const pageButtons = buildPageList(safePage, totalPages);

  if (total == null) return null;

  return (
    <div
      className={`border-t border-[var(--color-border)] bg-[#faf8f6] px-3 py-3 sm:px-4 ${className}`}
    >
      {/* Mobile: simple prev / status / next */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="text-center text-[12.5px] font-medium text-[var(--color-text-muted)]">
          {total === 0 ? (
            'No records'
          ) : (
            <>
              <span className="num text-[var(--color-text-primary)]">
                {from}-{to}
              </span>{' '}
              of <span className="num text-[var(--color-text-primary)]">{total}</span>
              <span className="mx-1.5 text-[#d0cbc4]">|</span>
              Page <span className="num text-[var(--color-text-primary)]">{safePage}</span> of{' '}
              <span className="num text-[var(--color-text-primary)]">{totalPages}</span>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!interactive || !canPrev}
            onClick={() => go(safePage - 1)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white text-[13px] font-semibold text-[var(--color-text-primary)] transition enabled:active:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            Previous
          </button>
          <button
            type="button"
            disabled={!interactive || !canNext}
            onClick={() => go(safePage + 1)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white text-[13px] font-semibold text-[var(--color-text-primary)] transition enabled:active:bg-gray-50 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        {onLimitChange ? (
          <label className="flex items-center justify-center gap-2 text-[12.5px] font-medium text-[var(--color-text-muted)]">
            Rows
            <select
              className="field-control !min-h-9 !w-auto !py-1.5 pe-8 text-[13px]"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {/* Desktop: summary + page buttons + rows */}
      <div className="hidden items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="text-[12.5px] font-medium text-[var(--color-text-muted)]">
          {total === 0 ? (
            'No records'
          ) : (
            <>
              Showing{' '}
              <span className="num text-[var(--color-text-primary)]">
                {from}-{to}
              </span>{' '}
              of <span className="num text-[var(--color-text-primary)]">{total}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onLimitChange ? (
            <label className="me-1 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">
              Rows
              <select
                className="field-control !min-h-9 !w-auto !py-1.5 pe-8 text-[13px]"
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                {limitOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            aria-label="Previous page"
            disabled={!interactive || !canPrev}
            onClick={() => go(safePage - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] transition enabled:hover:border-[var(--color-accent)]/30 enabled:hover:bg-[var(--color-accent-soft)] enabled:hover:text-[var(--color-accent)] disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {pageButtons.map((item, idx) =>
              item === '…' || item === '...' ? (
                <span
                  key={`e-${idx}`}
                  className="inline-flex h-9 w-7 items-center justify-center text-[12px] text-[var(--color-text-muted)]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={!interactive}
                  onClick={() => go(item)}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[13px] font-semibold tabular-nums transition ${
                    item === safePage
                      ? 'bg-[var(--color-accent)] text-white shadow-sm'
                      : 'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)]'
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            aria-label="Next page"
            disabled={!interactive || !canNext}
            onClick={() => go(safePage + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] transition enabled:hover:border-[var(--color-accent)]/30 enabled:hover:bg-[var(--color-accent-soft)] enabled:hover:text-[var(--color-accent)] disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function buildPageList(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('...');
    out.push(p);
    prev = p;
  }
  return out;
}

export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

export function SkeletonRows({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2.5 p-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {Array.from({ length: cols }).map((__, j) => (
            <SkeletonBlock
              key={j}
              className={`h-9 flex-1 ${j === 0 ? 'max-w-[18%]' : j === cols - 1 ? 'max-w-[14%]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Realistic table + compact mobile-card loading placeholders */
export function TableSkeleton({ columns = 5, rows = 7, mobileCards = true }) {
  const widths = ['12%', '22%', '16%', '14%', '18%', '12%', '10%', '10%'];
  const mobileRows = Math.min(rows, 5);
  return (
    <div role="status" aria-label="Loading" className="anim-in">
      {mobileCards ? (
        <div className="space-y-2 p-3 md:hidden">
          {Array.from({ length: mobileRows }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-5 w-14 !rounded-full" />
              </div>
              <div className="space-y-0 border-t border-[#f0eeec] px-3.5 py-1">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between gap-3 border-b border-[#f5f3f1] py-2.5 last:border-b-0"
                  >
                    <SkeletonBlock className="h-2.5 w-16" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`table-wrap ${mobileCards ? 'hidden md:block' : ''}`}>
        <table className="data-table min-w-full">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="text-start">
                  <SkeletonBlock className="h-2.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((__, c) => (
                  <td key={c}>
                    <SkeletonBlock
                      className="h-3.5"
                      style={{ width: widths[(r + c) % widths.length] }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <ul className="anim-in divide-y divide-[#f1efed]" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3 w-40 max-w-full" />
            <SkeletonBlock className="h-2.5 w-28 max-w-full" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <SkeletonBlock className="h-5 w-16 rounded-full" />
            <SkeletonBlock className="h-2.5 w-14" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3" role="status">
      <div className="spinner h-8 w-8 !border-[3px]" />
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}
