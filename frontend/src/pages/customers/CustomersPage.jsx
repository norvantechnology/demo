import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  SearchField,
  Button,
  Input,
  TextArea,
  CurrencyKwd,
  EmptyState,
  ErrorBanner,
  Panel,
  Toolbar,
  FilterBar,
  TextLink,
  Pagination,
} from '../../components/ui';

const emptyForm = { name: '', company: '', phone: '', email: '', address: '', note: '' };

export default function CustomersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [search]);

  const q = useQuery({
    queryKey: ['customers', search, page, limit],
    queryFn: async () =>
      (await api.get('/customers', { params: { search, page, limit } })).data,
    placeholderData: keepPreviousData,
  });

  const saveMut = useMutation({
    mutationFn: async (payload) => {
      if (editing) return (await api.patch(`/customers/${editing._id}`, payload)).data;
      return (await api.post('/customers', payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success(editing ? 'Customer updated' : 'Customer added');
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    },
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      name: row.name || '',
      company: row.company || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      note: row.note || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      mobilePrimary: true,
      cell: (r) => (
        <div>
          <span className="font-medium">{r.name}</span>
          {r.company ? <div className="subline">{r.company}</div> : null}
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', cell: (r) => r.phone || '-' },
    {
      key: 'jobOrders',
      header: 'Job Orders',
      mobileHeader: 'Orders',
      align: 'right',
      mobileAlign: 'start',
      cell: (r) => (
        <TextLink
          to={`/job-orders?customerId=${r._id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="num">{r.jobOrderCount || 0}</span>
        </TextLink>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      mobileHeader: 'Balance',
      align: 'right',
      mobileMoney: true,
      cell: (r) => (
        <span className={r.outstanding > 0 ? 'text-[var(--color-warning)]' : ''}>
          <CurrencyKwd value={r.outstanding || 0} />
        </span>
      ),
    },
    {
      key: 'edit',
      header: '',
      align: 'right',
      cell: (r) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(r);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Customers"
        actions={
          <Button className="w-full sm:w-auto" onClick={openAdd}>
            Add
          </Button>
        }
      />

      {q.isError ? <ErrorBanner onRetry={() => q.refetch()} /> : null}

      <Panel
        toolbar={
          <Toolbar>
            <FilterBar className="sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1">
              <SearchField
                label="Search"
                value={search}
                onChange={setSearch}
                placeholder="Name, company, phone..."
                className="max-w-md"
              />
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
              icon={Users}
              title="No customers yet"
              action={<Button onClick={openAdd}>Add customer</Button>}
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
        title={editing ? 'Edit customer' : 'Add customer'}
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={() => saveMut.mutate(form)}
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
            label="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <TextArea
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
