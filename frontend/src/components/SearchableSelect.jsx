import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  getOptionLabel = (o) => o.label,
  getOptionValue = (o) => o.value,
  extraAction,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => getOptionValue(o) === value);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => getOptionLabel(o).toLowerCase().includes(s));
  }, [options, q, getOptionLabel]);

  return (
    <div className="relative" ref={ref}>
            {label ? <span className="field-label">{label}</span> : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field-control flex items-center justify-between gap-2 text-start"
      >
        <span className={selected ? '' : 'text-[#9ca3af]'}>
          {selected ? getOptionLabel(selected) : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
      {error ? <span className="mt-1.5 block text-xs text-[var(--color-danger)]">{error}</span> : null}
      {open ? (
        <div className="absolute z-30 mt-1.5 max-h-64 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full border-0 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((o) => {
              const v = getOptionValue(o);
              return (
                <button
                  key={v}
                  type="button"
                  className={`block w-full px-3 py-2.5 text-start text-sm transition hover:bg-gray-50 ${
                    v === value ? 'bg-gray-50 font-semibold' : ''
                  }`}
                  onClick={() => {
                    onChange(v, o);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  {getOptionLabel(o)}
                </button>
              );
            })}
            {!filtered.length ? (
              <div className="px-3 py-3 text-sm text-[var(--color-text-muted)]">No matches</div>
            ) : null}
          </div>
          {extraAction ? (
            <div className="border-t border-[var(--color-border)] p-2">{extraAction}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
