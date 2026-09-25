import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { monthLabel } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { DataTable } from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  StatusPill,
  CurrencyKwd,
  Panel,
  ErrorBanner,
  PageLoader,
  Pagination,
} from '../../components/ui';

export default function PayrollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { isOwner } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const q = useQuery({
    queryKey: ['payroll', id],
    queryFn: async () => (await api.get(`/payroll/${id}`)).data,
  });

  const run = q.data;

  const approveMut = useMutation({
    mutationFn: async () => (await api.patch(`/payroll/${id}/approve`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', id] });
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payroll approved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const payMut = useMutation({
    mutationFn: async () => (await api.patch(`/payroll/${id}/pay`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', id] });
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payroll marked as paid');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const recomputeMut = useMutation({
    mutationFn: async () =>
      (await api.post('/payroll', { month: run.month, year: run.year })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', id] });
      qc.invalidateQueries({ queryKey: ['payroll-list'] });
      toast.success('Payroll recomputed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (q.isLoading) {
    return <PageLoader label="Loading payroll..." />;
  }

  if (q.isError || !run) return <ErrorBanner onRetry={() => q.refetch()} />;

  const allLines = run.lines || [];
  const pagedLines = allLines.slice((page - 1) * limit, page * limit);

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      mobilePrimary: true,
      cell: (r) => r.employee?.name || '-',
    },
    {
      key: 'net',
      header: 'Net pay',
      align: 'right',
      mobileBadge: true,
      cell: (r) => <CurrencyKwd value={r.netPay} />,
    },
    {
      key: 'basic',
      header: 'Basic salary',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.basicSalary} />,
    },
    {
      key: 'days',
      header: 'Days present',
      align: 'right',
      cell: (r) => <span className="num">{r.daysPresent}</span>,
    },
    {
      key: 'ot',
      header: 'Overtime pay',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.overtimePay} />,
    },
    {
      key: 'ded',
      header: 'Deductions',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.deductions} />,
    },
  ];

  const errMsg =
    approveMut.error || payMut.error || recomputeMut.error
      ? getErrorMessage(approveMut.error || payMut.error || recomputeMut.error)
      : '';

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={monthLabel(run.month, run.year)}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusPill status={run.status} />
            <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              <CurrencyKwd value={run.totalNet} />
            </span>
          </span>
        }
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => navigate('/payroll')}>
              Back
            </Button>
            {isOwner && run.status === 'draft' ? (
              <>
                <Button className="w-full sm:w-auto" loading={approveMut.isPending} onClick={() => approveMut.mutate()}>
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  loading={recomputeMut.isPending}
                  onClick={() => recomputeMut.mutate()}
                >
                  Recompute
                </Button>
              </>
            ) : null}
            {isOwner && run.status === 'approved' ? (
              <Button className="w-full sm:w-auto" loading={payMut.isPending} onClick={() => payMut.mutate()}>
                Mark as paid
              </Button>
            ) : null}
          </div>
        }
      />

      {errMsg ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errMsg}
        </div>
      ) : null}

      <Panel>
        <DataTable columns={columns} rows={pagedLines} loading={false} mobileCards />
        <Pagination
          page={page}
          limit={limit}
          total={allLines.length}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      </Panel>
    </div>
  );
}
