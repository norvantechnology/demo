import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { DataTable } from '../../components/DataTable';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  SegmentedTabs,
  Select,
  StatusPill,
  Input,
  ErrorBanner,
  EmptyState,
  Panel,
  Toolbar,
  Pagination,
} from '../../components/ui';

const VIEW_TABS = [
  { value: 'requests', label: 'Leave requests' },
  { value: 'balances', label: 'Balances' },
];

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual leave' },
  { value: 'sick_full_pay', label: 'Sick leave (full pay)' },
  { value: 'permission_hours', label: 'Permission (hours)' },
  { value: 'unpaid', label: 'Unpaid leave' },
];

const TYPE_LABELS = Object.fromEntries(LEAVE_TYPES.map((t) => [t.value, t.label]));

export default function LeavesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { isOwner } = useAuth();
  const [view, setView] = useState('requests');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [balancePage, setBalancePage] = useState(1);
  const [balanceLimit, setBalanceLimit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    type: 'annual',
    from: '',
    to: '',
    hours: 2,
    reason: '',
  });
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(null); // { action, row }

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    setBalancePage(1);
  }, [view]);

  const leavesQ = useQuery({
    queryKey: ['leaves', statusFilter, page, limit],
    queryFn: async () =>
      (await api.get('/leaves', { params: { status: statusFilter, page, limit } })).data,
    enabled: view === 'requests',
    placeholderData: keepPreviousData,
  });

  const balancesQ = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => (await api.get('/leaves/balances')).data,
    enabled: view === 'balances',
  });

  const balanceRows = balancesQ.data?.data || [];
  const balanceTotal = balanceRows.length;
  const pagedBalances = balanceRows.slice(
    (balancePage - 1) * balanceLimit,
    balancePage * balanceLimit
  );

  const employeesQ = useQuery({
    queryKey: ['employees-active'],
    queryFn: async () =>
      (await api.get('/employees', { params: { status: 'active', limit: 100 } })).data,
    enabled: modalOpen,
  });

  const employeeOptions =
    employeesQ.data?.data?.map((e) => ({
      value: e._id,
      label: `${e.name} (${e.employeeNo})`,
    })) || [];

  function invalidateLeaves() {
    qc.invalidateQueries({ queryKey: ['leaves'] });
    qc.invalidateQueries({ queryKey: ['leave-balances'] });
  }

  const createMut = useMutation({
    mutationFn: async (payload) => (await api.post('/leaves', payload)).data,
    onSuccess: () => {
      invalidateLeaves();
      setModalOpen(false);
      toast.success('Leave request submitted');
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    },
  });

  const approveMut = useMutation({
    mutationFn: async (id) => (await api.patch(`/leaves/${id}/approve`)).data,
    onSuccess: () => {
      setConfirm(null);
      invalidateLeaves();
      toast.success('Leave approved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMut = useMutation({
    mutationFn: async (id) => (await api.patch(`/leaves/${id}/reject`)).data,
    onSuccess: () => {
      setConfirm(null);
      invalidateLeaves();
      toast.success('Leave rejected');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => (await api.delete(`/leaves/${id}`)).data,
    onSuccess: () => {
      setConfirm(null);
      invalidateLeaves();
      toast.success('Leave deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const confirmBusy = approveMut.isPending || rejectMut.isPending || deleteMut.isPending;

  function askConfirm(action, row) {
    setConfirm({ action, row });
  }

  function runConfirm() {
    if (!confirm?.row?._id) return;
    const id = confirm.row._id;
    if (confirm.action === 'approve') approveMut.mutate(id);
    else if (confirm.action === 'reject') rejectMut.mutate(id);
    else if (confirm.action === 'delete') deleteMut.mutate(id);
  }

  const isPermission = form.type === 'permission_hours';

  function submitRequest() {
    const payload = {
      employeeId: form.employeeId,
      type: form.type,
      from: form.from,
      to: isPermission ? form.from : form.to,
      amount: isPermission ? Number(form.hours) : undefined,
      reason: form.reason,
    };
    createMut.mutate(payload);
  }

  const confirmCopy = (() => {
    if (!confirm) return null;
    const r = confirm.row;
    const name = r.employee?.name || 'this employee';
    const type = TYPE_LABELS[r.type] || r.type;
    const range =
      r.unit === 'hours'
        ? `${formatDate(r.from)} (${r.amount}h)`
        : `${formatDate(r.from)} to ${formatDate(r.to)} (${r.amount}d)`;
    if (confirm.action === 'approve') {
      return {
        title: 'Approve leave request?',
        body: `Approve ${type} for ${name} covering ${range}?`,
        confirmLabel: 'Approve',
        destructive: false,
      };
    }
    if (confirm.action === 'reject') {
      return {
        title: 'Reject leave request?',
        body: `Reject ${type} for ${name} covering ${range}? The request will stay in the list as rejected.`,
        confirmLabel: 'Reject',
        destructive: true,
      };
    }
    return {
      title: 'Delete leave request?',
      body: `Permanently delete ${type} for ${name} (${range})? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    };
  })();

  const requestColumns = [
    {
      key: 'employee',
      header: 'Employee',
      mobilePrimary: true,
      minWidth: 160,
      cell: (r) => (
        <div className="min-w-0 max-w-[200px]">
          <div className="truncate font-semibold leading-snug">{r.employee?.name || '-'}</div>
          {r.requestedBy?.name ? (
            <div className="subline truncate" title={`Requested by ${r.requestedBy.name}`}>
              by {r.requestedBy.name}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileBadge: true,
      nowrap: true,
      cell: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'decided',
      header: 'Decided by',
      nowrap: true,
      showOnMobile: false,
      cell: (r) =>
        r.decidedBy?.name ? (
          <span className="text-[13px] text-[var(--color-text-muted)]">{r.decidedBy.name}</span>
        ) : (
          <span className="text-[var(--color-text-muted)]">-</span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      nowrap: true,
      minWidth: 140,
      cell: (r) => (
        <span
          className="inline-flex max-w-[160px] truncate rounded-lg bg-[var(--color-neutral-bg)] px-2 py-1 text-[12px] font-semibold text-[var(--color-neutral)]"
          title={TYPE_LABELS[r.type] || r.type}
        >
          {TYPE_LABELS[r.type] || r.type}
        </span>
      ),
    },
    {
      key: 'from',
      header: 'From',
      nowrap: true,
      cell: (r) => formatDate(r.from),
    },
    {
      key: 'to',
      header: 'To',
      nowrap: true,
      cell: (r) => formatDate(r.to),
    },
    {
      key: 'amount',
      header: 'Duration',
      cell: (r) => (
        <span className="num whitespace-nowrap">
          {r.unit === 'hours' ? `${r.amount}h` : `${r.amount}d`}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      mobileAlone: true,
      mobileFull: true,
      minWidth: 140,
      cell: (r) =>
        r.reason ? (
          <span
            className="line-clamp-2 max-w-[180px] text-[13px] leading-snug text-[var(--color-text-muted)]"
            title={r.reason}
          >
            {r.reason}
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)]">-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      nowrap: true,
      cell: (r) => (
        <div className="flex flex-nowrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === 'pending' && isOwner ? (
            <>
              <Button size="sm" onClick={() => askConfirm('approve', r)}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => askConfirm('reject', r)}>
                Reject
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="danger" onClick={() => askConfirm('delete', r)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const balanceColumns = [
    { key: 'name', header: 'Employee', cell: (r) => r.name },
    {
      key: 'entitlement',
      header: 'Annual leave entitlement',
      align: 'right',
      cell: (r) => <span className="num">{r.entitlement} days/year</span>,
    },
    {
      key: 'taken',
      header: 'Taken',
      align: 'right',
      cell: (r) => <span className="num">{r.taken} days</span>,
    },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      cell: (r) => <span className="num">{r.remaining} days</span>,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Leaves"
        subtitle="Entered by supervisor, approved by administrator."
        actions={
          <Button className="w-full sm:w-auto" onClick={() => setModalOpen(true)}>
            New request
          </Button>
        }
      >
        <SegmentedTabs
          className="w-full"
          options={VIEW_TABS}
          value={view}
          onChange={setView}
        />
      </PageHeader>

      {view === 'requests' ? (
        <>
          {leavesQ.isError ? <ErrorBanner onRetry={() => leavesQ.refetch()} /> : null}
          <Panel
            toolbar={
              <Toolbar>
                <Select
                  label="Filter by status"
                  className="w-full sm:max-w-[220px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </Toolbar>
            }
          >
            <DataTable
              columns={requestColumns}
              rows={leavesQ.data?.data}
              loading={leavesQ.isLoading}
              refreshing={leavesQ.isFetching && !leavesQ.isLoading}
              mobileCards
              empty={<EmptyState title="No leave requests" />}
            />
            <Pagination
              page={leavesQ.data?.page || page}
              limit={leavesQ.data?.limit || limit}
              total={leavesQ.data?.total || 0}
              onPageChange={setPage}
              onLimitChange={(n) => {
                setLimit(n);
                setPage(1);
              }}
            />
          </Panel>
        </>
      ) : (
        <>
          {balancesQ.isError ? <ErrorBanner onRetry={() => balancesQ.refetch()} /> : null}
          <Panel>
            <DataTable
              columns={balanceColumns}
              rows={pagedBalances}
              loading={balancesQ.isLoading}
              refreshing={balancesQ.isFetching && !balancesQ.isLoading}
              mobileCards
              empty={<EmptyState title="No balance data" />}
            />
            <Pagination
              page={balancePage}
              limit={balanceLimit}
              total={balanceTotal}
              onPageChange={setBalancePage}
              onLimitChange={(n) => {
                setBalanceLimit(n);
                setBalancePage(1);
              }}
            />
          </Panel>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New request"
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={submitRequest}
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
            label="Employee *"
            options={employeeOptions}
            value={form.employeeId}
            onChange={(v) => setForm({ ...form, employeeId: v })}
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <Input
            label="From"
            type="date"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
          />
          {!isPermission ? (
            <Input
              label="To"
              type="date"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          ) : (
            <Input
              label="Hours"
              type="number"
              min={1}
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
          )}
          <Input
            label="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => {
          if (!confirmBusy) setConfirm(null);
        }}
        title={confirmCopy?.title || 'Confirm'}
        footer={
          <ModalActions
            onCancel={() => setConfirm(null)}
            confirmLabel={confirmCopy?.confirmLabel || 'Confirm'}
            destructive={confirmCopy?.destructive}
            loading={confirmBusy}
            onConfirm={runConfirm}
          />
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] font-medium leading-relaxed text-[var(--color-text-primary)]">
            {confirmCopy?.body}
          </p>
          {confirm?.row?.reason ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[#faf8f6] px-3.5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Reason
              </div>
              <p className="mt-1 text-[13px] leading-snug text-[var(--color-text-primary)]">
                {confirm.row.reason}
              </p>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
