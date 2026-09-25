import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate, formatMinutes, formatTime, MONTHS, monthLabel } from '../../lib/format';
import { DataTable } from '../../components/DataTable';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  Select,
  StatusPill,
  Card,
  Input,
  ErrorBanner,
  EmptyState,
  IconButton,
  Pagination,
} from '../../components/ui';

function toTimeInput(value) {
  if (!value) return '';
  return dayjs(value).format('HH:mm');
}

function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  return dayjs(`${dateStr}T${timeStr}`).toISOString();
}

function muteZero(n, display) {
  const empty = !n || n === 0 || display === '0:00' || display === '0' || display === '-';
  return (
    <span className={`num ${empty ? 'text-[#b0a9a1]' : ''}`}>{display}</span>
  );
}

function StatChip({ label, value, tone }) {
  const toneCls =
    tone === 'danger'
      ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]'
      : tone === 'warning'
        ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
        : tone === 'success'
          ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
          : 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${toneCls}`}>
      <span className="opacity-70">{label}</span>
      <span className="num">{value}</span>
    </span>
  );
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'absent', label: 'Has absent' },
  { id: 'late', label: 'Has late' },
  { id: 'ot', label: 'Has overtime' },
  { id: 'short', label: 'Has shortfall' },
];

export default function AttendancePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const detailRef = useRef(null);
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const [selectedId, setSelectedId] = useState(null);
  const [mobileView, setMobileView] = useState('summary'); // summary | detail
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [sumPage, setSumPage] = useState(1);
  const [sumLimit, setSumLimit] = useState(20);
  const [dayPage, setDayPage] = useState(1);
  const [dayLimit, setDayLimit] = useState(15);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({ checkIn: '', checkOut: '', note: '' });
  const [formError, setFormError] = useState('');

  const summaryQ = useQuery({
    queryKey: ['attendance-summary', month, year],
    queryFn: async () =>
      (await api.get('/attendance/summary', { params: { month, year } })).data,
  });

  const detailQ = useQuery({
    queryKey: ['attendance-detail', selectedId, month, year],
    queryFn: async () =>
      (await api.get(`/attendance/employee/${selectedId}`, { params: { month, year } })).data,
    enabled: Boolean(selectedId),
  });

  const summaryRows = summaryQ.data?.data || [];

  const filteredSorted = useMemo(() => {
    let rows = [...summaryRows];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          String(r.employeeNo || '').includes(q)
      );
    }
    if (quickFilter === 'absent') rows = rows.filter((r) => r.absent > 0);
    if (quickFilter === 'late') rows = rows.filter((r) => r.late > 0);
    if (quickFilter === 'ot') rows = rows.filter((r) => r.overtimeMinutes > 0);
    if (quickFilter === 'short') rows = rows.filter((r) => r.shortfallMinutes > 0);

    rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return dir * String(a.name || '').localeCompare(b.name || '');
      if (sortKey === 'present') return dir * ((a.present || 0) - (b.present || 0));
      if (sortKey === 'absent') return dir * ((a.absent || 0) - (b.absent || 0));
      if (sortKey === 'late') return dir * ((a.late || 0) - (b.late || 0));
      if (sortKey === 'ot') return dir * ((a.overtimeMinutes || 0) - (b.overtimeMinutes || 0));
      return 0;
    });
    return rows;
  }, [summaryRows, search, quickFilter, sortKey, sortDir]);

  const selectedIndex = filteredSorted.findIndex((r) => r.employeeId === selectedId);
  const selectedSummary = summaryRows.find((r) => r.employeeId === selectedId);
  const selectedEmployee = detailQ.data?.employee;

  const pagedSummary = useMemo(() => {
    const start = (sumPage - 1) * sumLimit;
    return filteredSorted.slice(start, start + sumLimit);
  }, [filteredSorted, sumPage, sumLimit]);

  const detailRows = detailQ.data?.data || [];
  const pagedDetail = useMemo(() => {
    const start = (dayPage - 1) * dayLimit;
    return detailRows.slice(start, start + dayLimit);
  }, [detailRows, dayPage, dayLimit]);

  useEffect(() => {
    setSumPage(1);
  }, [search, quickFilter, month, year, sortKey, sortDir]);

  useEffect(() => {
    setDayPage(1);
  }, [selectedId, month, year]);

  useEffect(() => {
    if (!selectedId || mobileView !== 'detail') return;
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedId, mobileView]);

  const recomputeMut = useMutation({
    mutationFn: async () => (await api.post('/attendance/recompute', { month, year })).data,
    onSuccess: () => {
      toast.success('Attendance recomputed');
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
      qc.invalidateQueries({ queryKey: ['attendance-detail'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const saveMut = useMutation({
    mutationFn: async () =>
      (
        await api.patch(`/attendance/${editRecord._id}`, {
          checkIn: combineDateTime(dayjs(editRecord.date).format('YYYY-MM-DD'), editForm.checkIn),
          checkOut: combineDateTime(dayjs(editRecord.date).format('YYYY-MM-DD'), editForm.checkOut),
          note: editForm.note,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-detail'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
      setEditRecord(null);
      toast.success('Attendance updated');
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    },
  });

  const deviceMut = useMutation({
    mutationFn: async () =>
      (await api.post(`/attendance/${editRecord._id}/use-device-punches`)).data,
    onSuccess: (data) => {
      setEditForm({
        checkIn: toTimeInput(data.checkIn),
        checkOut: toTimeInput(data.checkOut),
        note: data.note || '',
      });
      qc.invalidateQueries({ queryKey: ['attendance-detail'] });
      toast.success('Device punches applied');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function selectEmployee(row) {
    setSelectedId(row.employeeId);
    setMobileView('detail');
  }

  function clearSelection() {
    setSelectedId(null);
    setMobileView('summary');
  }

  function goNeighbor(delta) {
    if (selectedIndex < 0) return;
    const next = filteredSorted[selectedIndex + delta];
    if (next) selectEmployee(next);
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  function exportCsv() {
    const rows = detailQ.data?.data || [];
    if (!rows.length) {
      toast.error('Nothing to export');
      return;
    }
    const name = selectedEmployee?.name || selectedSummary?.name || 'employee';
    const header = ['Date', 'Status', 'Check in', 'Check out', 'Worked', 'Late', 'Overtime', 'Shortfall'];
    const lines = rows.map((r) =>
      [
        dayjs(r.date).format('YYYY-MM-DD'),
        r.status,
        formatTime(r.checkIn) || '',
        formatTime(r.checkOut) || '',
        formatMinutes(r.workedMinutes),
        formatMinutes(r.lateMinutes),
        formatMinutes(r.overtimeMinutes),
        formatMinutes(r.shortfallMinutes),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${name.replace(/\s+/g, '-').toLowerCase()}-${month}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance exported');
  }

  function SortHead({ id, children, align = 'left' }) {
    const active = sortKey === id;
    return (
      <button
        type="button"
        onClick={() => toggleSort(id)}
        className={`inline-flex items-center gap-1 font-inherit uppercase tracking-[0.045em] ${
          align === 'right' ? 'ms-auto' : ''
        } ${active ? 'text-[var(--color-accent)]' : ''}`}
      >
        {children}
        <span className="text-[10px] opacity-70">{active ? (sortDir === 'asc' ? 'asc' : 'desc') : ''}</span>
      </button>
    );
  }

  const summaryColumns = [
    {
      key: 'employee',
      header: <SortHead id="name">Employee</SortHead>,
      mobilePrimary: true,
      minWidth: 170,
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">
            <div className="truncate font-semibold">{r.name}</div>
            <div className="subline">{r.employeeNo}</div>
          </div>
          {selectedId === r.employeeId ? (
            <ChevronRight className="ms-auto h-4 w-4 shrink-0 text-[var(--color-accent)]" />
          ) : null}
        </div>
      ),
    },
    {
      key: 'present',
      header: <SortHead id="present" align="right">Present</SortHead>,
      align: 'right',
      nowrap: true,
      cell: (r) => muteZero(r.present, r.present),
    },
    {
      key: 'absent',
      header: <SortHead id="absent" align="right">Absent</SortHead>,
      align: 'right',
      nowrap: true,
      cell: (r) => (
        <span className={`num ${r.absent > 0 ? 'text-[var(--color-danger)]' : 'text-[#b0a9a1]'}`}>
          {r.absent}
        </span>
      ),
    },
    {
      key: 'late',
      header: <SortHead id="late" align="right">Late</SortHead>,
      align: 'right',
      nowrap: true,
      cell: (r) => (
        <span className={`num ${r.late > 0 ? 'text-[var(--color-warning)]' : 'text-[#b0a9a1]'}`}>
          {r.late}
        </span>
      ),
    },
    {
      key: 'ot',
      header: <SortHead id="ot" align="right">Overtime</SortHead>,
      align: 'right',
      nowrap: true,
      cell: (r) => (
        <span
          className={`num ${
            r.overtimeMinutes > 0 ? 'text-[var(--color-success)]' : 'text-[#b0a9a1]'
          }`}
        >
          {formatMinutes(r.overtimeMinutes)}
        </span>
      ),
    },
  ];

  const detailColumns = [
    {
      key: 'date',
      header: 'Date',
      mobilePrimary: true,
      nowrap: true,
      minWidth: 100,
      cell: (r) => (
        <div className="leading-tight">
          <div className="font-semibold whitespace-nowrap">{formatDate(r.date)}</div>
          <div className="subline">{dayjs(r.date).format('ddd')}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileBadge: true,
      nowrap: true,
      cell: (r) => (
        <div className="inline-flex items-center gap-1.5">
          <StatusPill status={r.status} />
          {r.source === 'device' && r.status === 'present' ? (
            <span className="inline-flex rounded-md bg-[var(--color-info-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-info)]">
              Device
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'hours',
      header: 'In/Out',
      nowrap: true,
      cell: (r) => {
        const inn = formatTime(r.checkIn);
        const out = formatTime(r.checkOut);
        if (!inn && !out) return <span className="text-[#b0a9a1]">-</span>;
        return (
          <span className="num whitespace-nowrap text-[13px]">
            {inn || '-'}
            <span className="mx-1 text-[var(--color-text-muted)]">/</span>
            {out || '-'}
          </span>
        );
      },
    },
    {
      key: 'worked',
      header: 'Worked',
      align: 'right',
      nowrap: true,
      cell: (r) => muteZero(r.workedMinutes, formatMinutes(r.workedMinutes)),
    },
    {
      key: 'notes',
      header: 'Exceptions',
      mobileFull: true,
      cell: (r) => {
        const chips = [];
        if (r.lateMinutes > 0) {
          chips.push(
            <span
              key="l"
              className="inline-flex rounded-md bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-warning)]"
            >
              Late {formatMinutes(r.lateMinutes)}
            </span>
          );
        }
        if (r.overtimeMinutes > 0) {
          chips.push(
            <span
              key="o"
              className="inline-flex rounded-md bg-[var(--color-success-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-success)]"
            >
              OT {formatMinutes(r.overtimeMinutes)}
            </span>
          );
        }
        if (r.shortfallMinutes > 0) {
          chips.push(
            <span
              key="s"
              className="inline-flex rounded-md bg-[var(--color-danger-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-danger)]"
            >
              Short {formatMinutes(r.shortfallMinutes)}
            </span>
          );
        }
        return chips.length ? (
          <div className="flex flex-wrap gap-1">{chips}</div>
        ) : (
          <span className="text-[#b0a9a1]">-</span>
        );
      },
    },
    {
      key: 'edit',
      header: '',
      align: 'right',
      cell: (r) => (
        <button
          type="button"
          aria-label="Edit day"
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 text-[13px] font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)]"
          onClick={(e) => {
            e.stopPropagation();
            setEditRecord(r);
            setEditForm({
              checkIn: toTimeInput(r.checkIn),
              checkOut: toTimeInput(r.checkOut),
              note: r.note || '',
            });
            setFormError('');
          }}
        >
          Edit
        </button>
      ),
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.year() - 2 + i);
  const periodLabel = monthLabel(month, year);
  const showMobileDetail = mobileView === 'detail' && selectedId;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Attendance"
        subtitle={`Team presence for ${periodLabel}`}
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Select
              className="min-w-0 flex-1 sm:w-[150px] sm:flex-none"
              value={month}
              aria-label="Month"
              onChange={(e) => {
                setMonth(Number(e.target.value));
                clearSelection();
              }}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select
              className="min-w-0 flex-[0.7] sm:w-[110px] sm:flex-none"
              value={year}
              aria-label="Year"
              onChange={(e) => {
                setYear(Number(e.target.value));
                clearSelection();
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <IconButton
              label="Recompute attendance"
              className="h-11 w-11 shrink-0 border-[var(--color-border)] bg-transparent sm:h-10 sm:w-10"
              onClick={() => {
                if (window.confirm('Recompute attendance for this month from device punches?')) {
                  recomputeMut.mutate();
                }
              }}
              disabled={recomputeMut.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 ${recomputeMut.isPending ? 'animate-spin' : ''}`}
                strokeWidth={1.85}
              />
            </IconButton>
          </div>
        }
      />

      {summaryQ.isError ? <ErrorBanner onRetry={() => summaryQ.refetch()} /> : null}

      {/* Mobile: sticky context when in detail */}
      {showMobileDetail ? (
        <div className="sticky top-[58px] z-20 -mx-3 flex items-center gap-2 border-b border-[var(--color-border)] bg-white/95 px-3 py-2.5 backdrop-blur sm:-mx-5 sm:px-5 lg:hidden">
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2 font-semibold text-[var(--color-accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Summary
          </button>
          <div className="min-w-0 flex-1 truncate text-[13px] font-bold">
            {selectedEmployee?.name || selectedSummary?.name}
          </div>
          <IconButton
            label="Previous employee"
            disabled={selectedIndex <= 0}
            onClick={() => goNeighbor(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Next employee"
            disabled={selectedIndex < 0 || selectedIndex >= filteredSorted.length - 1}
            onClick={() => goNeighbor(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      ) : null}

      <div
        className={`grid grid-cols-1 gap-4 ${
          selectedId ? 'lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.25fr)]' : ''
        }`}
      >
        {/* SUMMARY */}
        <div className={showMobileDetail ? 'hidden lg:block' : 'block'}>
          <Card
            title="Team summary"
            action={
              <span className="hidden text-[12px] font-medium text-[var(--color-text-muted)] sm:inline">
                Select a person to open days
              </span>
            }
            noPadding
          >
            <div className="space-y-2.5 border-b border-[var(--color-border)] bg-[#faf8f6] px-3 py-3 sm:px-4">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="field-control !ps-9"
                />
              </div>
              <div className="tabs-scroll gap-1.5">
                {FILTERS.map((f) => {
                  const active = quickFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setQuickFilter(f.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                        active
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-white text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact mobile list */}
            <div className="divide-y divide-[#f0eeec] md:hidden">
              {summaryQ.isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredSorted.length === 0 ? (
                <EmptyState icon={UserRound} title="No employees match this filter" />
              ) : (
                pagedSummary.map((r) => {
                  const selected = selectedId === r.employeeId;
                  return (
                    <button
                      key={r.employeeId}
                      type="button"
                      onClick={() => selectEmployee(r)}
                      className={`flex w-full flex-col gap-2 px-3 py-3 text-start transition ${
                        selected ? 'bg-[var(--color-accent-soft)]' : 'bg-white active:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{r.name}</div>
                          <div className="subline">{r.employeeNo}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <StatChip label="P" value={r.present} />
                        <StatChip
                          label="A"
                          value={r.absent}
                          tone={r.absent > 0 ? 'danger' : undefined}
                        />
                        <StatChip
                          label="L"
                          value={r.late}
                          tone={r.late > 0 ? 'warning' : undefined}
                        />
                        <StatChip
                          label="OT"
                          value={formatMinutes(r.overtimeMinutes)}
                          tone={r.overtimeMinutes > 0 ? 'success' : undefined}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {!summaryQ.isLoading && filteredSorted.length > 0 ? (
              <div className="md:hidden">
                <Pagination
                  page={sumPage}
                  limit={sumLimit}
                  total={filteredSorted.length}
                  onPageChange={setSumPage}
                  onLimitChange={(n) => {
                    setSumLimit(n);
                    setSumPage(1);
                  }}
                />
              </div>
            ) : null}

            {/* Desktop table */}
            <div className="hidden md:block">
              <DataTable
                columns={summaryColumns}
                rows={pagedSummary}
                loading={summaryQ.isLoading}
                refreshing={summaryQ.isFetching && !summaryQ.isLoading}
                keyField="employeeId"
                selectedKey={selectedId}
                onRowClick={selectEmployee}
                mobileCards={false}
                empty={<EmptyState icon={UserRound} title="No employees match this filter" />}
              />
              {!summaryQ.isLoading ? (
                <Pagination
                  page={sumPage}
                  limit={sumLimit}
                  total={filteredSorted.length}
                  onPageChange={setSumPage}
                  onLimitChange={(n) => {
                    setSumLimit(n);
                    setSumPage(1);
                  }}
                />
              ) : null}
            </div>
          </Card>
        </div>

        {/* DETAIL */}
        <div
          ref={detailRef}
          className={`scroll-mt-24 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}
        >
          {!selectedId ? (
            <Card className="hidden lg:block">
              <EmptyState
                icon={UserRound}
                title="Select an employee from the summary to open their daily log."
              />
            </Card>
          ) : (
            <Card
              title={
                <span className="truncate">
                  Daily log - {selectedEmployee?.name || selectedSummary?.name || '...'}
                </span>
              }
              action={
                <div className="flex items-center gap-1">
                  <IconButton
                    label="Previous"
                    className="hidden lg:inline-flex"
                    disabled={selectedIndex <= 0}
                    onClick={() => goNeighbor(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Next"
                    className="hidden lg:inline-flex"
                    disabled={selectedIndex < 0 || selectedIndex >= filteredSorted.length - 1}
                    onClick={() => goNeighbor(1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Export CSV" onClick={exportCsv}>
                    <Download className="h-4 w-4" />
                  </IconButton>
                  <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              }
              noPadding
            >
              {detailQ.isError ? (
                <ErrorBanner onRetry={() => detailQ.refetch()} />
              ) : (
                <>
                  <div className="mx-3 mt-3 rounded-xl border border-[var(--color-border)] bg-[#f7f4f1] px-3 py-2.5 sm:mx-4">
                    <div className="flex flex-wrap gap-1.5">
                      <StatChip
                        label="#"
                        value={selectedEmployee?.employeeNo || selectedSummary?.employeeNo || '-'}
                      />
                      <StatChip label="Present" value={selectedSummary?.present ?? '-'} />
                      <StatChip
                        label="Absent"
                        value={selectedSummary?.absent ?? '-'}
                        tone={(selectedSummary?.absent || 0) > 0 ? 'danger' : undefined}
                      />
                      <StatChip
                        label="Late"
                        value={selectedSummary?.late ?? '-'}
                        tone={(selectedSummary?.late || 0) > 0 ? 'warning' : undefined}
                      />
                      <StatChip
                        label="OT"
                        value={formatMinutes(selectedSummary?.overtimeMinutes || 0)}
                        tone={(selectedSummary?.overtimeMinutes || 0) > 0 ? 'success' : undefined}
                      />
                    </div>
                  </div>
                  <DataTable
                    columns={detailColumns}
                    rows={pagedDetail}
                    loading={detailQ.isLoading}
                    refreshing={detailQ.isFetching && !detailQ.isLoading}
                    empty={<EmptyState title="No day records for this month" />}
                  />
                  {!detailQ.isLoading && detailRows.length > 0 ? (
                    <Pagination
                      page={dayPage}
                      limit={dayLimit}
                      total={detailRows.length}
                      onPageChange={setDayPage}
                      onLimitChange={(n) => {
                        setDayLimit(n);
                        setDayPage(1);
                      }}
                    />
                  ) : null}
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(editRecord)}
        onClose={() => setEditRecord(null)}
        title={editRecord ? `Edit - ${formatDate(editRecord.date)}` : 'Edit'}
        footer={
          <ModalActions
            onCancel={() => setEditRecord(null)}
            onConfirm={() => saveMut.mutate()}
            loading={saveMut.isPending}
          />
        }
      >
        {formError ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
        <div className="space-y-3">
          <Input
            label="Check in"
            type="time"
            value={editForm.checkIn}
            onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
          />
          <Input
            label="Check out"
            type="time"
            value={editForm.checkOut}
            onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
          />
          <Input
            label="Note"
            value={editForm.note}
            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
          />
          <Button variant="secondary" loading={deviceMut.isPending} onClick={() => deviceMut.mutate()}>
            Use device punches
          </Button>
        </div>
      </Modal>
    </div>
  );
}
