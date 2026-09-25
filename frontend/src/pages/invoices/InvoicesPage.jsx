import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { FileText, Download, CircleDollarSign, Banknote, Wallet, AlertTriangle } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { DataTable } from '../../components/DataTable';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  StatCard,
  StatusPill,
  SegmentedTabs,
  CurrencyKwd,
  Input,
  EmptyState,
  ErrorBanner,
  Panel,
  Toolbar,
  TextLink,
  SearchField,
  FilterBar,
  Pagination,
} from '../../components/ui';

export default function InvoicesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    jobOrderId: '',
    total: '',
    dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatus(s);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  function onStatusChange(v) {
    setStatus(v);
    if (v === 'all') searchParams.delete('status');
    else searchParams.set('status', v);
    setSearchParams(searchParams);
  }

  const q = useQuery({
    queryKey: ['invoices', status, search, page, limit],
    queryFn: async () =>
      (
        await api.get('/invoices', {
          params: { status, search: search || undefined, page, limit },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const countsQ = useQuery({
    queryKey: ['invoices-counts'],
    queryFn: async () => {
      const statuses = ['all', 'open', 'unpaid', 'partial', 'overdue', 'paid'];
      const results = await Promise.all(
        statuses.map((s) => api.get('/invoices', { params: { status: s, limit: 1 } }))
      );
      return Object.fromEntries(statuses.map((s, i) => [s, results[i].data.total ?? 0]));
    },
  });

  const counts = countsQ.data || {};
  const STATUS_TABS = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'open', label: 'Open', count: counts.open },
    { value: 'unpaid', label: 'Unpaid', count: counts.unpaid },
    { value: 'partial', label: 'Partial', count: counts.partial },
    { value: 'overdue', label: 'Overdue', count: counts.overdue },
    { value: 'paid', label: 'Paid', count: counts.paid },
  ];

  const joQ = useQuery({
    queryKey: ['job-orders-uninvoiced'],
    queryFn: async () => (await api.get('/job-orders', { params: { limit: 100 } })).data,
    enabled: createOpen,
  });

  const uninvoiced =
    joQ.data?.data?.filter((jo) => !jo.invoice).map((jo) => ({
      value: jo._id,
      label: `#${jo.jobOrderNo} - ${jo.customer?.name || ''} - ${jo.jobNature}`,
    })) || [];

  const createMut = useMutation({
    mutationFn: async (payload) => (await api.post('/invoices', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices-counts'] });
      qc.invalidateQueries({ queryKey: ['job-orders'] });
      setCreateOpen(false);
      setForm({ jobOrderId: '', total: '', dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD') });
      toast.success('Invoice created');
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    },
  });

  const totals = q.data?.totals;

  function exportCsv() {
    const rows = q.data?.data || [];
    const header = ['Invoice', 'Date', 'Due', 'Customer', 'Total', 'Paid', 'Balance', 'Status'];
    const lines = rows.map((r) =>
      [
        `INV-${r.invoiceNo}`,
        formatDate(r.date),
        formatDate(r.dueDate),
        r.customer?.name || '',
        r.total,
        r.paid,
        r.balance,
        r.displayStatus || r.status,
      ]
        .map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${status}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  }

  const columns = [
    {
      key: 'no',
      header: 'Invoice No.',
      mobilePrimary: true,
      cell: (r) => (
        <TextLink to={`/invoices/${r._id}`} className="font-medium">
          INV-{r.invoiceNo}
        </TextLink>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileBadge: true,
      cell: (r) => <StatusPill status={r.displayStatus || r.status} />,
    },
    { key: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
    {
      key: 'due',
      header: 'Due date',
      cell: (r) => (
        <span className={r.displayStatus === 'overdue' ? 'text-[var(--color-danger)]' : ''}>
          {formatDate(r.dueDate)}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      mobileAlone: true,
      cell: (r) => (
        <div>
          <div>{r.customer?.name}</div>
          {r.customer?.company ? <div className="subline">{r.customer.company}</div> : null}
        </div>
      ),
    },
    {
      key: 'jo',
      header: 'JO No.',
      mobileAlone: true,
      cell: (r) =>
        r.jobOrder ? (
          <TextLink to={`/job-orders/${r.jobOrder._id || r.jobOrder}`}>
            #{r.jobOrder.jobOrderNo || r.jobOrder}
          </TextLink>
        ) : (
          '-'
        ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.total} />,
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      cell: (r) => (
        <span className={r.paid > 0 ? 'text-[var(--color-success)]' : ''}>
          <CurrencyKwd value={r.paid} />
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.balance} />,
    },
  ];

  const filterLabel = STATUS_TABS.find((t) => t.value === status)?.label.toLowerCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Invoices"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
              Create invoice
            </Button>
          </div>
        }
      />

      {/* Mobile: full-width rows so KWD amounts never truncate */}
      <div className="flex flex-col gap-2 sm:hidden">
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={CircleDollarSign}
          label="Total"
          value={totals ? <CurrencyKwd value={totals.total} /> : '-'}
        />
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={Banknote}
          label="Paid"
          value={totals ? <CurrencyKwd value={totals.paid} /> : '-'}
          tone="success"
        />
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={Wallet}
          label="Outstanding"
          value={totals ? <CurrencyKwd value={totals.outstanding} /> : '-'}
          tone="warning"
        />
        <StatCard
          layout="row"
          loading={q.isLoading}
          icon={AlertTriangle}
          label="Overdue"
          value={totals ? <CurrencyKwd value={totals.overdue} /> : '-'}
          tone="danger"
        />
      </div>

      <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
        <StatCard
          loading={q.isLoading}
          icon={CircleDollarSign}
          label="Total"
          value={totals ? <CurrencyKwd value={totals.total} /> : '-'}
        />
        <StatCard
          loading={q.isLoading}
          icon={Banknote}
          label="Paid"
          value={totals ? <CurrencyKwd value={totals.paid} /> : '-'}
          tone="success"
        />
        <StatCard
          loading={q.isLoading}
          icon={Wallet}
          label="Outstanding"
          value={totals ? <CurrencyKwd value={totals.outstanding} /> : '-'}
          tone="warning"
        />
        <StatCard
          loading={q.isLoading}
          icon={AlertTriangle}
          label="Overdue"
          value={totals ? <CurrencyKwd value={totals.overdue} /> : '-'}
          tone="danger"
        />
      </div>

      {q.isError ? <ErrorBanner onRetry={() => q.refetch()} /> : null}

      <Panel
        toolbar={
          <Toolbar>
            <FilterBar className="lg:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(260px,1fr)_auto]">
              <SearchField
                label="Search"
                value={search}
                onChange={setSearch}
                placeholder="Invoice, customer, JO..."
              />
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <span className="field-label">Status</span>
                <SegmentedTabs
                  className="w-full"
                  options={STATUS_TABS}
                  value={status}
                  onChange={onStatusChange}
                  loading={countsQ.isLoading}
                />
              </div>
            </FilterBar>
          </Toolbar>
        }
      >
        <DataTable
          columns={columns}
          rows={q.data?.data}
          loading={q.isLoading}
          refreshing={q.isFetching && !q.isLoading}
          mobileCards
          empty={<EmptyState icon={FileText} title={`No ${filterLabel} invoices.`} />}
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create invoice"
        footer={
          <ModalActions
            onCancel={() => setCreateOpen(false)}
            confirmLabel="Create invoice"
            onConfirm={() =>
              createMut.mutate({
                jobOrderId: form.jobOrderId,
                total: Number(form.total),
                dueDate: form.dueDate,
              })
            }
            loading={createMut.isPending}
          />
        }
      >
        {formError ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
        <div className="space-y-3">
          <SearchableSelect
            label="Job Order"
            options={uninvoiced}
            value={form.jobOrderId}
            onChange={(v) => setForm({ ...form, jobOrderId: v })}
            placeholder="Select job order"
          />
          <Input
            label="Total (KWD)"
            type="number"
            step="0.001"
            value={form.total}
            onChange={(e) => setForm({ ...form, total: e.target.value })}
          />
          <Input
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
