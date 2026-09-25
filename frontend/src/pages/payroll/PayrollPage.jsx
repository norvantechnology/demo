import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Wallet, FileCheck, Clock, Banknote } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate, monthLabel, MONTHS } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { DataTable } from '../../components/DataTable';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  StatusPill,
  CurrencyKwd,
  Select,
  EmptyState,
  ErrorBanner,
  Panel,
  StatCard,
  Pagination,
} from '../../components/ui';

function toListRow(doc) {
  return {
    _id: doc._id,
    month: doc.month,
    year: doc.year,
    status: doc.status,
    totalNet: doc.totalNet,
    computedAt: doc.computedAt,
  };
}

export default function PayrollPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const now = dayjs();
  const [form, setForm] = useState({ month: now.month() + 1, year: now.year() });
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const rulesQ = useQuery({
    queryKey: ['payroll-rules'],
    queryFn: async () => (await api.get('/settings/payroll-rules')).data,
  });

  const q = useQuery({
    queryKey: ['payroll-list', page, limit],
    queryFn: async () => (await api.get('/payroll', { params: { page, limit } })).data,
    placeholderData: keepPreviousData,
  });

  const createMut = useMutation({
    mutationFn: async (payload) => {
      const body = {
        month: Number(payload.month),
        year: Number(payload.year),
      };
      return (await api.post('/payroll', body)).data;
    },
    onSuccess: async (doc) => {
      const row = toListRow(doc);
      qc.setQueryData(['payroll-list'], (old) => {
        if (!old?.data) {
          return { data: [row], total: 1, page: 1, limit: 100 };
        }
        const idx = old.data.findIndex((r) => String(r._id) === String(row._id));
        if (idx >= 0) {
          const data = [...old.data];
          data[idx] = { ...data[idx], ...row };
          return { ...old, data };
        }
        return {
          ...old,
          data: [row, ...old.data],
          total: (old.total || old.data.length) + 1,
        };
      });
      await qc.invalidateQueries({ queryKey: ['payroll-list'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      setFormError('');
      setModalOpen(false);
      toast.success('Payroll ready', { title: monthLabel(doc.month, doc.year) });
      navigate(`/payroll/${doc._id}`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    },
  });

  const prepareDays = rulesQ.data?.preparePayrollDaysBeforeMonthEnd ?? 3;
  const years = Array.from({ length: 5 }, (_, i) => now.year() - 2 + i);
  const rows = q.data?.data || [];

  const ytd = rows
    .filter((r) => r.year === now.year())
    .reduce((sum, r) => sum + (Number(r.totalNet) || 0), 0);
  const draftCount = rows.filter((r) => r.status === 'draft').length;
  const pendingCount = rows.filter((r) => r.status === 'approved').length;
  const lastPaid = rows.find((r) => r.status === 'paid');

  const columns = [
    {
      key: 'period',
      header: 'Period',
      mobilePrimary: true,
      cell: (r) => (
        <span className="font-semibold">{monthLabel(r.month, r.year)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileBadge: true,
      cell: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'from',
      header: 'From',
      cell: (r) =>
        formatDate(dayjs(`${r.year}-${String(r.month).padStart(2, '0')}-01`).toDate()),
    },
    {
      key: 'total',
      header: 'Total net',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.totalNet} />,
    },
    {
      key: 'edit',
      header: '',
      align: 'right',
      cell: (r) => (
        <Button size="sm" variant="secondary" onClick={() => navigate(`/payroll/${r._id}`)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Payroll"
        subtitle={`Payroll is prepared ${prepareDays} days before the month ends.`}
        actions={
          isOwner ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setFormError('');
                setModalOpen(true);
              }}
            >
              Create payroll
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-2 sm:hidden">
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={Banknote}
          label="Payroll YTD"
          value={<CurrencyKwd value={ytd} />}
        />
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={Clock}
          label="Draft runs"
          value={draftCount}
          tone={draftCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={FileCheck}
          label="Approved (unpaid)"
          value={pendingCount}
          tone={pendingCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={Wallet}
          label="Last paid"
          value={lastPaid ? <CurrencyKwd value={lastPaid.totalNet} /> : '-'}
          sublabel={
            lastPaid ? monthLabel(lastPaid.month, lastPaid.year) : 'No paid runs yet'
          }
          tone="success"
        />
      </div>

      <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
        <StatCard
          loading={q.isLoading}
          icon={Banknote}
          label="Payroll YTD"
          value={<CurrencyKwd value={ytd} />}
        />
        <StatCard
          loading={q.isLoading}
          icon={Clock}
          label="Draft runs"
          value={draftCount}
          tone={draftCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          loading={q.isLoading}
          icon={FileCheck}
          label="Approved (unpaid)"
          value={pendingCount}
          tone={pendingCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          loading={q.isLoading}
          icon={Wallet}
          label="Last paid"
          value={lastPaid ? <CurrencyKwd value={lastPaid.totalNet} /> : '-'}
          sublabel={
            lastPaid ? monthLabel(lastPaid.month, lastPaid.year) : 'No paid runs yet'
          }
          tone="success"
        />
      </div>

      {q.isError ? <ErrorBanner onRetry={() => q.refetch()} /> : null}

      <Panel>
        <DataTable
          columns={columns}
          rows={rows}
          loading={q.isLoading}
          refreshing={q.isFetching && !q.isLoading}
          mobileCards
          empty={
            <EmptyState
              icon={Wallet}
              title="No payroll runs yet"
              action={
                isOwner ? (
                  <Button onClick={() => setModalOpen(true)}>Create payroll</Button>
                ) : null
              }
            />
          }
        />
        <Pagination
          page={q.data?.page || page}
          limit={q.data?.limit || limit}
          total={q.data?.total || 0}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      </Panel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create payroll"
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            confirmLabel="Create payroll"
            onConfirm={() =>
              createMut.mutate({
                month: Number(form.month),
                year: Number(form.year),
              })
            }
            loading={createMut.isPending}
          />
        }
      >
        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
        <p className="text-sm text-[var(--color-text-muted)]">
          Computed from attendance and approved leave. Can be recomputed while it is a draft.
          Creating an existing draft period will recompute it.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Month"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
          <Select
            label="Year"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
