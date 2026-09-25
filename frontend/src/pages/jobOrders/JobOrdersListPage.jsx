import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Printer } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { DataTable } from '../../components/DataTable';
import {
  PageHeader,
  SearchField,
  Button,
  StatusPill,
  SegmentedTabs,
  EmptyState,
  ErrorBanner,
  Panel,
  Toolbar,
  TextLink,
  IconButton,
  Pagination,
  FilterBar,
} from '../../components/ui';

export default function JobOrdersListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId') || '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [search, status, customerId]);

  const q = useQuery({
    queryKey: ['job-orders', status, search, customerId, page, limit],
    queryFn: async () =>
      (
        await api.get('/job-orders', {
          params: {
            status,
            search,
            customerId: customerId || undefined,
            page,
            limit,
          },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const countsQ = useQuery({
    queryKey: ['job-orders-counts', customerId],
    queryFn: async () => {
      const statuses = ['all', 'new', 'in_press', 'done'];
      const results = await Promise.all(
        statuses.map((s) =>
          api.get('/job-orders', {
            params: { status: s, customerId: customerId || undefined, limit: 1 },
          })
        )
      );
      return Object.fromEntries(statuses.map((s, i) => [s, results[i].data.total ?? 0]));
    },
  });

  const counts = countsQ.data || {};
  const STATUS_TABS = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'new', label: 'New', count: counts.new },
    { value: 'in_press', label: 'In press', count: counts.in_press },
    { value: 'done', label: 'Done', count: counts.done },
  ];

  const columns = [
    {
      key: 'no',
      header: 'JO No.',
      mobilePrimary: true,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <TextLink to={`/job-orders/${r._id}`} className="font-semibold">
            #{r.jobOrderNo}
          </TextLink>
          {r.pendingChangeRequests > 0 ? (
            <span className="rounded-full bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-warning)]">
              {r.pendingChangeRequests}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileBadge: true,
      cell: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (r) => formatDate(r.date),
    },
    {
      key: 'customer',
      header: 'Customer',
      mobileFull: true,
      mobileAlone: true,
      cell: (r) => (
        <div>
          <div>{r.customer?.name}</div>
          {r.customer?.company ? <div className="subline">{r.customer.company}</div> : null}
        </div>
      ),
    },
    { key: 'jobNature', header: 'Job Nature', cell: (r) => r.jobNature },
    {
      key: 'qty',
      header: 'Qty',
      cell: (r) => <span className="num">{r.qtyRequired}</span>,
    },
    {
      key: 'invoice',
      header: 'Invoice',
      mobileAlone: true,
      cell: (r) =>
        r.invoice ? (
          <TextLink to={`/invoices/${r.invoice._id || r.invoice}`}>
            INV-{r.invoice.invoiceNo || r.invoice}
          </TextLink>
        ) : (
          '-'
        ),
    },
    {
      key: 'print',
      header: '',
      align: 'right',
      cell: (r) => (
        <IconButton
          label="Print"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`/job-orders/${r._id}/print`, '_blank');
          }}
        >
          <Printer size={16} />
        </IconButton>
      ),
    },
  ];

  const filterLabel = STATUS_TABS.find((t) => t.value === status)?.label.toLowerCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Job Orders"
        actions={
          <Button className="w-full sm:w-auto" onClick={() => navigate('/job-orders/new')}>
            New job order
          </Button>
        }
      />

      {q.isError ? <ErrorBanner onRetry={() => q.refetch()} /> : null}

      <Panel
        toolbar={
          <Toolbar>
            <FilterBar className="lg:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(260px,1fr)_auto]">
              <SearchField
                label="Search"
                value={search}
                onChange={setSearch}
                placeholder="Job no., customer, nature..."
              />
              <div className="min-w-0">
                <span className="field-label">Status</span>
                <SegmentedTabs
                  className="w-full"
                  options={STATUS_TABS}
                  value={status}
                  onChange={setStatus}
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
          empty={
            <EmptyState
              icon={ClipboardList}
              title={status === 'all' ? 'No job orders yet' : `No ${filterLabel} job orders.`}
              action={<Button onClick={() => navigate('/job-orders/new')}>New job order</Button>}
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
    </div>
  );
}
