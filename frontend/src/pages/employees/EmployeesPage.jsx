import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { UserRound, X } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { DataTable } from '../../components/DataTable';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  SearchField,
  Button,
  Input,
  TextArea,
  Select,
  StatusPill,
  CurrencyKwd,
  EmptyState,
  ErrorBanner,
  Panel,
  Toolbar,
  FilterBar,
  TextLink,
  SegmentedTabs,
  Pagination,
} from '../../components/ui';

const emptyForm = {
  name: '',
  arabicName: '',
  jobTitle: '',
  phone: '',
  deviceId: '',
  civilId: '',
  hireDate: '',
  basicSalaryKwd: 250,
  status: 'active',
  note: '',
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [jobTitle, setJobTitle] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [search, status, jobTitle]);

  const q = useQuery({
    queryKey: ['employees', search, status, jobTitle, page, limit],
    queryFn: async () =>
      (
        await api.get('/employees', {
          params: {
            search: search || undefined,
            status,
            jobTitle: jobTitle || undefined,
            page,
            limit,
          },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const titlesQ = useQuery({
    queryKey: ['employee-job-titles'],
    queryFn: async () =>
      (await api.get('/employees', { params: { status: 'all', limit: 1 } })).data,
  });

  const jobTitles = titlesQ.data?.jobTitles || q.data?.jobTitles || [];

  const statusTabs = useMemo(
    () => [
      {
        value: 'active',
        label: 'Active',
        count: q.data?.activeCount ?? titlesQ.data?.activeCount,
      },
      {
        value: 'inactive',
        label: 'Inactive',
        count: q.data?.inactiveCount ?? titlesQ.data?.inactiveCount,
      },
      {
        value: 'all',
        label: 'All',
        count:
          (q.data?.activeCount ?? titlesQ.data?.activeCount ?? 0) +
          (q.data?.inactiveCount ?? titlesQ.data?.inactiveCount ?? 0) || undefined,
      },
    ],
    [q.data, titlesQ.data]
  );

  const hasFilters = Boolean(search || jobTitle || status !== 'active');

  const saveMut = useMutation({
    mutationFn: async (payload) => {
      if (editing) return (await api.patch(`/employees/${editing._id}`, payload)).data;
      return (await api.post('/employees', payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-job-titles'] });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success(editing ? 'Employee updated' : 'Employee added');
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
      arabicName: row.arabicName || '',
      jobTitle: row.jobTitle || '',
      phone: row.phone || '',
      deviceId: row.deviceId || '',
      civilId: row.civilId || '',
      hireDate: row.hireDate ? row.hireDate.slice(0, 10) : '',
      basicSalaryKwd: row.basicSalaryKwd ?? 250,
      status: row.status || 'active',
      note: row.note || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function clearFilters() {
    setSearch('');
    setStatus('active');
    setJobTitle('');
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      mobilePrimary: true,
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          {r.arabicName ? (
            <div className="subline" dir="rtl">
              {r.arabicName}
            </div>
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
      key: 'no',
      header: 'ID',
      cell: (r) => <span className="num">{r.employeeNo}</span>,
    },
    { key: 'jobTitle', header: 'Job title', cell: (r) => r.jobTitle || '-' },
    { key: 'phone', header: 'Phone', cell: (r) => r.phone || '-' },
    { key: 'deviceId', header: 'Device ID', cell: (r) => r.deviceId || '-' },
    {
      key: 'hireDate',
      header: 'Hire date',
      cell: (r) => formatDate(r.hireDate),
    },
    {
      key: 'salary',
      header: 'Basic salary',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.basicSalaryKwd} />,
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

  const formFields = (
    <div className="space-y-3">
      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      ) : null}
      <Input
        label="Name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Arabic name"
        value={form.arabicName}
        onChange={(e) => setForm({ ...form, arabicName: e.target.value })}
      />
      <Input
        label="Job title"
        value={form.jobTitle}
        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
        list="employee-job-titles"
      />
      <datalist id="employee-job-titles">
        {jobTitles.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <Input
        label="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label="Device ID"
        hint="User ID on the fingerprint terminal"
        value={form.deviceId}
        onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
      />
      <Input
        label="Civil ID"
        value={form.civilId}
        onChange={(e) => setForm({ ...form, civilId: e.target.value })}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Hire date *"
          type="date"
          value={form.hireDate}
          onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
        />
        <Input
          label="Basic salary (KWD) *"
          type="number"
          step="0.001"
          inputMode="decimal"
          value={form.basicSalaryKwd}
          onChange={(e) => setForm({ ...form, basicSalaryKwd: Number(e.target.value) })}
        />
      </div>
      {editing ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Employee No." value={editing.employeeNo} readOnly disabled />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      ) : (
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      )}
      <TextArea
        label="Note"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
      />
    </div>
  );

  const subtitleParts = [];
  if (q.data?.activeCount != null) subtitleParts.push(`${q.data.activeCount} active`);
  if (q.data?.inactiveCount) subtitleParts.push(`${q.data.inactiveCount} inactive`);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Employees"
        subtitle={subtitleParts.join(' - ') || undefined}
        actions={
          <Button className="w-full sm:w-auto" onClick={openAdd}>
            Add employee
          </Button>
        }
      />

      {q.isError ? <ErrorBanner onRetry={() => q.refetch()} /> : null}

      <Panel
        toolbar={
          <Toolbar>
            <FilterBar>
              <SearchField
                label="Search"
                value={search}
                onChange={setSearch}
                placeholder="Name, phone, device ID..."
                className="sm:col-span-2 lg:col-span-1"
              />
              <Select
                label="Job title"
                className="w-full"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              >
                <option value="">All job titles</option>
                {jobTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <span className="field-label">Status</span>
                <SegmentedTabs
                  className="w-full max-w-full"
                  options={statusTabs}
                  value={status}
                  onChange={setStatus}
                  loading={q.isLoading || titlesQ.isLoading}
                />
              </div>
              {hasFilters ? (
                <div className="flex sm:col-span-2 xl:col-span-1">
                  <Button
                    variant="secondary"
                    className="h-[42px] w-full sm:h-10 xl:w-auto"
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                </div>
              ) : null}
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
              icon={UserRound}
              title={
                hasFilters
                  ? 'No employees match these filters'
                  : 'No employees yet'
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={openAdd}>Add employee</Button>
                )
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
        title={editing ? 'Edit employee' : 'Add employee'}
        wide
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={() => saveMut.mutate(form)}
            loading={saveMut.isPending}
          />
        }
      >
        {formFields}
      </Modal>
    </div>
  );
}
