import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserX,
  ClipboardCheck,
  Printer,
  Wallet,
  AlertTriangle,
  CircleDollarSign,
  Banknote,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  PageHeader,
  StatCard,
  StatusPill,
  Card,
  ErrorBanner,
  Button,
  CurrencyKwd,
  TextLink,
  SectionHeader,
  ListSkeleton,
} from '../components/ui';
import { formatDate, monthLabel } from '../lib/format';

export default function DashboardPage() {
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });

  const d = q.data;
  const pendingTotal = d
    ? (d.pendingApprovals.leaveRequests || 0) + (d.pendingApprovals.changeRequests || 0)
    : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Dashboard" />

      {q.isError ? <ErrorBanner onRetry={() => q.refetch()} /> : null}

      <section>
        <SectionHeader title="Team" subtitle="Today’s attendance and approvals" />

        {/* Mobile: compact rows - no truncated labels, full width for values */}
        <div className="flex flex-col gap-2 sm:hidden">
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={Users}
            label="Present today"
            value={d ? `${d.presentToday}/${d.totalActive}` : '-'}
            sublabel={`Late ${d?.lateToday ?? 0} - Leave ${d?.onLeaveToday ?? 0}`}
            tone="success"
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={UserX}
            label="Absent"
            value={d?.absentToday ?? '-'}
            tone={d?.absentToday > 0 ? 'danger' : 'default'}
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={ClipboardCheck}
            label="Pending approvals"
            value={pendingTotal || '-'}
            tone={pendingTotal > 0 ? 'warning' : 'default'}
            sublabel={`Leave ${d?.pendingApprovals.leaveRequests ?? 0} - Changes ${d?.pendingApprovals.changeRequests ?? 0}`}
            onClick={() => navigate('/leaves')}
          />
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={Printer}
            label="In press"
            value={d?.inPress.count ?? '-'}
            sublabel={`New ${d?.inPress.new ?? 0} - Done 30d ${d?.inPress.done30d ?? 0}`}
            onClick={() => navigate('/job-orders')}
          />
        </div>

        {/* sm+: classic 2-4 card grid */}
        <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-4">
          <StatCard
            loading={q.isLoading}
            icon={Users}
            label="Present today"
            value={d ? `${d.presentToday}/${d.totalActive}` : '-'}
            sublabel={`Late: ${d?.lateToday ?? 0} - Leave: ${d?.onLeaveToday ?? 0}`}
            tone="success"
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            loading={q.isLoading}
            icon={UserX}
            label="Absent"
            value={d?.absentToday ?? '-'}
            tone={d?.absentToday > 0 ? 'danger' : 'default'}
            onClick={() => navigate('/attendance')}
          />
          <StatCard
            loading={q.isLoading}
            icon={ClipboardCheck}
            label="Pending approvals"
            value={pendingTotal || '-'}
            tone={pendingTotal > 0 ? 'warning' : 'default'}
            sublabel={`Leave: ${d?.pendingApprovals.leaveRequests ?? 0} - Changes: ${d?.pendingApprovals.changeRequests ?? 0}`}
            onClick={() => navigate('/leaves')}
          />
          <StatCard
            loading={q.isLoading}
            icon={Printer}
            label="In press"
            value={d?.inPress.count ?? '-'}
            sublabel={`New: ${d?.inPress.new ?? 0} - Done (30d): ${d?.inPress.done30d ?? 0}`}
            onClick={() => navigate('/job-orders')}
          />
        </div>
      </section>

      <section>
        <SectionHeader title="Finance" subtitle="Collections and billing this month" />

        <div className="flex flex-col gap-2 sm:hidden">
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={Wallet}
            label="Outstanding"
            value={d ? <CurrencyKwd value={d.outstanding} /> : '-'}
            tone="warning"
            sublabel={`${d?.openInvoices ?? 0} open invoices`}
            onClick={() => navigate('/invoices')}
          />
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={AlertTriangle}
            label="Overdue"
            value={d ? <CurrencyKwd value={d.overdue} /> : '-'}
            tone="danger"
            onClick={() => navigate('/invoices?status=overdue')}
          />
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={CircleDollarSign}
            label="Billed this month"
            value={d ? <CurrencyKwd value={d.billedThisMonth} /> : '-'}
          />
          <StatCard
            layout="row"
            loading={q.isLoading}
            icon={Banknote}
            label="Collected this month"
            value={d ? <CurrencyKwd value={d.collectedThisMonth} /> : '-'}
            tone="success"
          />
        </div>

        <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-4">
          <StatCard
            loading={q.isLoading}
            icon={Wallet}
            label="Outstanding"
            value={d ? <CurrencyKwd value={d.outstanding} /> : '-'}
            tone="warning"
            sublabel={`Open invoices: ${d?.openInvoices ?? 0}`}
            onClick={() => navigate('/invoices')}
          />
          <StatCard
            loading={q.isLoading}
            icon={AlertTriangle}
            label="Overdue"
            value={d ? <CurrencyKwd value={d.overdue} /> : '-'}
            tone="danger"
            onClick={() => navigate('/invoices?status=overdue')}
          />
          <StatCard
            loading={q.isLoading}
            icon={CircleDollarSign}
            label="Billed this month"
            value={d ? <CurrencyKwd value={d.billedThisMonth} /> : '-'}
          />
          <StatCard
            loading={q.isLoading}
            icon={Banknote}
            label="Collected this month"
            value={d ? <CurrencyKwd value={d.collectedThisMonth} /> : '-'}
            tone="success"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <Card title="Recent job orders" action={<TextLink to="/job-orders">All</TextLink>} noPadding>
          {q.isLoading ? (
            <ListSkeleton rows={5} />
          ) : (d?.recentJobOrders || []).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No recent job orders
            </div>
          ) : (
            <ul>
              {(d?.recentJobOrders || []).map((jo) => (
                <li
                  key={jo._id}
                  className="flex items-center justify-between gap-3 border-b border-[#f1efed] px-3.5 py-3 last:border-0 sm:px-4"
                >
                  <div className="min-w-0">
                    <TextLink to={`/job-orders/${jo._id}`} className="text-[14px]">
                      #{jo.jobOrderNo}
                    </TextLink>
                    <div className="mt-0.5 truncate text-[13px] text-[var(--color-text-primary)]">
                      {jo.customer?.name}
                    </div>
                    {jo.customer?.company ? (
                      <div className="subline truncate">{jo.customer.company}</div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusPill status={jo.status} />
                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      {formatDate(jo.date)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Unpaid invoices"
          action={<TextLink to="/invoices?status=unpaid">All</TextLink>}
          noPadding
        >
          {q.isLoading ? (
            <ListSkeleton rows={5} />
          ) : (d?.unpaidInvoices || []).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No unpaid invoices
            </div>
          ) : (
            <ul>
              {(d?.unpaidInvoices || []).map((inv) => (
                <li
                  key={inv._id}
                  className="flex items-start justify-between gap-3 border-b border-[#f1efed] px-3.5 py-3 last:border-0 sm:px-4"
                >
                  <div className="min-w-0">
                    <TextLink to={`/invoices/${inv._id}`} className="text-[14px]">
                      INV-{inv.invoiceNo}
                    </TextLink>
                    <div className="mt-0.5 truncate text-[13px]">{inv.customer?.name}</div>
                    {inv.customer?.company ? (
                      <div className="subline truncate">{inv.customer.company}</div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-end">
                    <StatusPill status={inv.displayStatus || inv.status} />
                    <div
                      className={`text-[11px] ${
                        inv.displayStatus === 'overdue'
                          ? 'text-[var(--color-danger)]'
                          : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {formatDate(inv.dueDate)}
                    </div>
                    <div className="text-[13px] font-semibold">
                      <CurrencyKwd value={inv.balance ?? inv.total} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {d?.latestPayroll ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-caption">Latest payroll</div>
              <div className="mt-1 text-lg font-semibold">
                {monthLabel(d.latestPayroll.month, d.latestPayroll.year)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={d.latestPayroll.status} />
                <span className="text-[15px] font-semibold">
                  <CurrencyKwd value={d.latestPayroll.totalNet} />
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => navigate(`/payroll/${d.latestPayroll._id}`)}
            >
              Open payroll
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
