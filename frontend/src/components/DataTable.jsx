import { useEffect, useRef, useState } from 'react';
import { EmptyState, TableSkeleton } from './ui';

function useScrollFades(ref, deps) {
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    function update() {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 2) {
        setEdges({ start: false, end: false });
        return;
      }
      setEdges({
        start: el.scrollLeft > 4,
        end: el.scrollLeft < max - 4,
      });
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, deps);

  return edges;
}

/**
 * Mobile: compact cards with aligned label | value rows.
 * Desktop: table with edge fades for overflow (no text hints).
 */
export function DataTable({
  columns,
  rows,
  loading,
  refreshing = false,
  empty,
  mobileCards = true,
  keyField = '_id',
  onRowClick,
  selectedKey,
}) {
  const scrollRef = useRef(null);
  const edges = useScrollFades(scrollRef, [rows, columns, loading]);

  if (loading) {
    return (
      <TableSkeleton
        columns={Math.min(columns.length, 8)}
        rows={7}
        mobileCards={mobileCards}
      />
    );
  }

  if (!rows?.length) {
    return empty || <EmptyState title="No records" />;
  }

  const visibleCols = columns.filter((col) => col.showOnMobile !== false);
  const titleCol = visibleCols.find((c) => c.mobilePrimary) || visibleCols[0];
  const badgeCol = visibleCols.find((c) => c.mobileBadge);
  const actionCols = columns.filter((c) => !c.header && c.showOnMobile !== false);
  const fieldCols = visibleCols.filter(
    (c) => c !== titleCol && c !== badgeCol && c.header
  );

  return (
    <div className="relative">
      {refreshing ? (
        <div className="loading-bar absolute inset-x-0 top-0 z-10" aria-label="Refreshing" />
      ) : null}

      <div
        className={`transition-opacity duration-200 ${refreshing ? 'pointer-events-none opacity-55' : ''}`}
      >
        {mobileCards ? (
          <div className="space-y-2 p-3 md:hidden">
            {rows.map((row, idx) => {
              const selected = selectedKey != null && row[keyField] === selectedKey;
              return (
                <div
                  key={row[keyField]}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) onRowClick(row);
                  }}
                  className={`anim-in overflow-hidden rounded-2xl border bg-white transition ${
                    selected
                      ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                      : 'border-[var(--color-border)]'
                  } ${onRowClick ? 'active:bg-gray-50' : ''}`}
                  style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
                >
                  {/* Header — title + badge + actions on one row */}
                  <div className="flex items-start justify-between gap-2.5 px-3.5 py-3">
                    <div className="min-w-0 flex-1 text-[15px] font-bold leading-snug tracking-tight">
                      {titleCol?.cell(row)}
                    </div>
                    {badgeCol || actionCols.length ? (
                      <div className="flex shrink-0 items-center gap-2 self-center">
                        {badgeCol ? <div>{badgeCol.cell(row)}</div> : null}
                        {actionCols.map((col) => (
                          <div key={col.key} onClick={(e) => e.stopPropagation()}>
                            {col.cell(row)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Fields — fixed label column, values share one vertical line */}
                  {fieldCols.length ? (
                    <div className="border-t border-[#eeebe8] px-3.5 py-1">
                      {fieldCols.map((col) => (
                        <MobileField key={col.key} col={col} row={row} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className={mobileCards ? 'hidden md:block' : ''}>
          <div
            className="scroll-fade"
            data-can-scroll-start={edges.start ? 'true' : 'false'}
            data-can-scroll-end={edges.end ? 'true' : 'false'}
          >
            <div ref={scrollRef} className="table-wrap">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`${col.align === 'right' ? 'text-end' : 'text-start'} ${col.width || ''}`}
                        style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selected = selectedKey != null && row[keyField] === selectedKey;
                    return (
                      <tr
                        key={row[keyField]}
                        className={`${
                          selected
                            ? '!bg-[var(--color-accent-soft)] shadow-[inset_3px_0_0_0_var(--color-accent)]'
                            : ''
                        } ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onRowClick?.(row)}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`${col.align === 'right' ? 'text-end num' : 'text-start'} ${
                              col.nowrap ? 'whitespace-nowrap' : ''
                            }`}
                          >
                            {col.cell(row)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fixed label column so every value starts on the same vertical line */
function MobileField({ col, row }) {
  // Currency end-aligned; counts/text start-aligned (override with mobileAlign / mobileMoney)
  const endAligned =
    col.mobileAlign === 'end' ||
    col.mobileMoney === true ||
    (col.align === 'right' && col.mobileAlign !== 'start' && col.mobileMoney !== false && isCurrencyCol(col));

  return (
    <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-baseline gap-x-3 border-b border-[#f3f1ef] py-2 last:border-b-0">
      <div className="text-[11px] font-medium leading-snug text-[var(--color-text-muted)]">
        {col.mobileHeader || col.header}
      </div>
      <div
        className={`min-w-0 text-[13px] font-semibold leading-snug text-[var(--color-text-primary)] ${
          endAligned ? 'num text-end' : 'text-start'
        }`}
      >
        {col.cell(row)}
      </div>
    </div>
  );
}

function isCurrencyCol(col) {
  if (col.mobileMoney === true) return true;
  if (col.mobileMoney === false) return false;
  const h = String(col.header || '').toLowerCase();
  return /total|paid|balance|outstanding|salary|net|amount|deduction|overtime|ytd|pay/.test(h);
}
