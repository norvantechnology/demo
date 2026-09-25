import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { DataTable } from '../../components/DataTable';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  SegmentedTabs,
  Input,
  TextArea,
  Select,
  StatusPill,
  Panel,
  ErrorBanner,
  EmptyState,
  TextLink,
} from '../../components/ui';

const TABS = [
  { value: 'company', label: 'Company details' },
  { value: 'attendance', label: 'Attendance rules' },
  { value: 'payroll', label: 'Payroll rules' },
  { value: 'holidays', label: 'Holidays' },
  { value: 'devices', label: 'Devices' },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPage() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('company');
  const [error, setError] = useState('');

  const [companyForm, setCompanyForm] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState(null);
  const [payrollForm, setPayrollForm] = useState(null);
  const [holidayModal, setHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', recurring: false });
  const [deviceModal, setDeviceModal] = useState(false);
  const [deviceEditing, setDeviceEditing] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ name: '', ip: '', port: 4370 });

  const companyQ = useQuery({
    queryKey: ['settings-company'],
    queryFn: async () => (await api.get('/settings/company')).data,
    enabled: isOwner,
  });

  const attendanceQ = useQuery({
    queryKey: ['settings-attendance'],
    queryFn: async () => (await api.get('/settings/attendance-rules')).data,
    enabled: isOwner && tab === 'attendance',
  });

  const payrollQ = useQuery({
    queryKey: ['settings-payroll'],
    queryFn: async () => (await api.get('/settings/payroll-rules')).data,
    enabled: isOwner && tab === 'payroll',
  });

  const holidaysQ = useQuery({
    queryKey: ['settings-holidays'],
    queryFn: async () => (await api.get('/settings/holidays')).data,
    enabled: isOwner && tab === 'holidays',
  });

  const devicesQ = useQuery({
    queryKey: ['settings-devices'],
    queryFn: async () => (await api.get('/settings/devices')).data,
    enabled: isOwner && tab === 'devices',
  });

  useEffect(() => {
    if (companyQ.data && !companyForm) {
      setCompanyForm({
        name: companyQ.data.name || '',
        arabicName: companyQ.data.arabicName || '',
        address: companyQ.data.address || '',
        phone: companyQ.data.phone || '',
        email: companyQ.data.email || '',
        brandColor: companyQ.data.brandColor || '#111111',
        invoiceFooterEn: companyQ.data.invoiceFooterEn || '',
        invoiceFooterAr: companyQ.data.invoiceFooterAr || '',
        invoiceDueDays: companyQ.data.invoiceDueDays ?? 30,
        counters: {
          jobOrderNext: companyQ.data.counters?.jobOrderNext ?? 7001,
          invoiceNext: companyQ.data.counters?.invoiceNext ?? 1,
          employeeNext: companyQ.data.counters?.employeeNext ?? 1,
        },
        logoUrl: companyQ.data.logoUrl,
      });
    }
  }, [companyQ.data, companyForm]);

  useEffect(() => {
    if (attendanceQ.data && !attendanceForm) {
      setAttendanceForm({
        shiftStart: attendanceQ.data.shiftStart || '08:00',
        shiftEnd: attendanceQ.data.shiftEnd || '18:00',
        requiredHoursPerDay: attendanceQ.data.requiredHoursPerDay ?? 8,
        graceMinutes: attendanceQ.data.graceMinutes ?? 10,
        minSessionMinutes: attendanceQ.data.minSessionMinutes ?? 5,
        weekend: attendanceQ.data.weekend || ['Friday'],
      });
    }
  }, [attendanceQ.data, attendanceForm]);

  useEffect(() => {
    if (payrollQ.data && !payrollForm) {
      setPayrollForm({ ...payrollQ.data });
    }
  }, [payrollQ.data, payrollForm]);

  const saveCompanyMut = useMutation({
    mutationFn: async () => (await api.patch('/settings/company', companyForm)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-company'] });
      setError('');
      toast.success('Company details saved');
    },
    onError: (e) => {
      const msg = getErrorMessage(e);
      setError(msg);
      toast.error(msg);
    },
  });

  const logoMut = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('logo', file);
      return (await api.post('/settings/company/logo', fd)).data;
    },
    onSuccess: (data) => {
      setCompanyForm((f) => ({ ...f, logoUrl: data.logoUrl }));
      qc.invalidateQueries({ queryKey: ['settings-company'] });
      toast.success('Logo uploaded');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const saveAttendanceMut = useMutation({
    mutationFn: async () => (await api.patch('/settings/attendance-rules', attendanceForm)).data,
    onSuccess: () => {
      setError('');
      toast.success('Attendance rules saved');
    },
    onError: (e) => {
      const msg = getErrorMessage(e);
      setError(msg);
      toast.error(msg);
    },
  });

  const savePayrollMut = useMutation({
    mutationFn: async () => (await api.patch('/settings/payroll-rules', payrollForm)).data,
    onSuccess: () => {
      setError('');
      toast.success('Payroll rules saved');
    },
    onError: (e) => {
      const msg = getErrorMessage(e);
      setError(msg);
      toast.error(msg);
    },
  });

  const addHolidayMut = useMutation({
    mutationFn: async () => (await api.post('/settings/holidays', holidayForm)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-holidays'] });
      setHolidayModal(false);
      setHolidayForm({ name: '', date: '', recurring: false });
      toast.success('Holiday added');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteHolidayMut = useMutation({
    mutationFn: async (id) => (await api.delete(`/settings/holidays/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-holidays'] });
      toast.success('Holiday deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const saveDeviceMut = useMutation({
    mutationFn: async () => {
      if (deviceEditing) return (await api.patch(`/settings/devices/${deviceEditing._id}`, deviceForm)).data;
      return (await api.post('/settings/devices', deviceForm)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-devices'] });
      setDeviceModal(false);
      setDeviceEditing(null);
      toast.success(deviceEditing ? 'Device updated' : 'Device added');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const syncMut = useMutation({
    mutationFn: async (id) => (await api.post(`/settings/devices/${id}/sync-now`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-devices'] });
      toast.success('Device sync started');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  function toggleWeekend(day) {
    setAttendanceForm((f) => {
      const w = f.weekend.includes(day) ? f.weekend.filter((d) => d !== day) : [...f.weekend, day];
      return { ...f, weekend: w };
    });
  }

  if (!isOwner) return <Navigate to="/dashboard" replace />;

  const holidayColumns = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
    { key: 'recurring', header: 'Recurring', cell: (r) => (r.recurring ? 'Yes' : 'No') },
    {
      key: 'del',
      header: '',
      align: 'right',
      showOnMobile: false,
      cell: (r) => (
        <Button size="sm" variant="danger" onClick={() => deleteHolidayMut.mutate(r._id)}>
          Delete
        </Button>
      ),
    },
  ];

  const deviceColumns = [
    { key: 'name', header: 'Name', cell: (r) => r.name },
    { key: 'ip', header: 'IP : Port', cell: (r) => `${r.ip} : ${r.port}` },
    {
      key: 'sync',
      header: 'Last sync',
      cell: (r) => (
        <div>
          <div>{r.lastSyncAt ? formatDateTime(r.lastSyncAt) : '-'}</div>
          {r.lastSyncNote ? (
            <div className="subline text-[var(--color-danger)]">{r.lastSyncNote}</div>
          ) : null}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      showOnMobile: false,
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => syncMut.mutate(r._id)}>
            Sync now
          </Button>
          <TextLink
            onClick={() => {
              setDeviceEditing(r);
              setDeviceForm({ name: r.name, ip: r.ip, port: r.port });
              setDeviceModal(true);
            }}
          >
            Edit
          </TextLink>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title="Settings" subtitle="Company branding, attendance, payroll, holidays and devices.">
        <SegmentedTabs className="w-full" options={TABS} value={tab} onChange={setTab} />
      </PageHeader>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {tab === 'company' && companyForm ? (
        <Panel>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Name *" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
              <Input label="Arabic name" value={companyForm.arabicName} onChange={(e) => setCompanyForm({ ...companyForm, arabicName: e.target.value })} />
              <Input className="sm:col-span-2" label="Address" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
              <Input label="Phone" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
              <Input label="Email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
            </div>
            <div className="mt-4">
              <div className="mb-1 text-sm text-[var(--color-text-muted)]">Logo</div>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[var(--color-border)] bg-gray-50 text-xs text-[var(--color-text-muted)]">
                  {companyForm.logoUrl ? (
                    <img src={companyForm.logoUrl} alt="Logo" className="max-h-full max-w-full" />
                  ) : (
                    'No logo'
                  )}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="inline-flex min-h-10 items-center rounded-lg border border-[var(--color-border)] px-4 text-sm hover:bg-gray-50">
                      Upload logo
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && logoMut.mutate(e.target.files[0])}
                    />
                  </label>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    PNG, JPG, WEBP or SVG up to 2 MB. Shown on the login page, sidebar and printed sheets.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-[var(--color-text-muted)]">Brand colour</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={companyForm.brandColor}
                    onChange={(e) => setCompanyForm({ ...companyForm, brandColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input value={companyForm.brandColor} onChange={(e) => setCompanyForm({ ...companyForm, brandColor: e.target.value })} />
                </div>
              </div>
              <Input label="Invoice Due date (days)" type="number" value={companyForm.invoiceDueDays} onChange={(e) => setCompanyForm({ ...companyForm, invoiceDueDays: Number(e.target.value) })} />
              <TextArea className="sm:col-span-2" label="Invoice footer (EN)" value={companyForm.invoiceFooterEn} onChange={(e) => setCompanyForm({ ...companyForm, invoiceFooterEn: e.target.value })} />
              <TextArea className="sm:col-span-2" label="Invoice footer (AR)" value={companyForm.invoiceFooterAr} onChange={(e) => setCompanyForm({ ...companyForm, invoiceFooterAr: e.target.value })} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input label="JO No. next" type="number" value={companyForm.counters.jobOrderNext} onChange={(e) => setCompanyForm({ ...companyForm, counters: { ...companyForm.counters, jobOrderNext: Number(e.target.value) } })} />
              <Input label="Invoice No. next" type="number" value={companyForm.counters.invoiceNext} onChange={(e) => setCompanyForm({ ...companyForm, counters: { ...companyForm.counters, invoiceNext: Number(e.target.value) } })} />
              <Input label="Employee No. next" type="number" value={companyForm.counters.employeeNext} onChange={(e) => setCompanyForm({ ...companyForm, counters: { ...companyForm.counters, employeeNext: Number(e.target.value) } })} />
            </div>
            <div className="mt-6 flex justify-end">
              <Button className="w-full sm:w-auto" loading={saveCompanyMut.isPending} onClick={() => saveCompanyMut.mutate()}>Save</Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === 'attendance' && attendanceForm ? (
        <Panel>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Shift start" type="time" value={attendanceForm.shiftStart} onChange={(e) => setAttendanceForm({ ...attendanceForm, shiftStart: e.target.value })} />
              <Input label="Shift end" type="time" value={attendanceForm.shiftEnd} onChange={(e) => setAttendanceForm({ ...attendanceForm, shiftEnd: e.target.value })} />
              <Input label="Required hours per day" type="number" value={attendanceForm.requiredHoursPerDay} onChange={(e) => setAttendanceForm({ ...attendanceForm, requiredHoursPerDay: Number(e.target.value) })} />
              <Input label="Grace minutes" type="number" value={attendanceForm.graceMinutes} onChange={(e) => setAttendanceForm({ ...attendanceForm, graceMinutes: Number(e.target.value) })} />
              <div>
                <Input label="Minimum session (minutes)" type="number" value={attendanceForm.minSessionMinutes} onChange={(e) => setAttendanceForm({ ...attendanceForm, minSessionMinutes: Number(e.target.value) })} />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  A punch pair shorter than this is treated as a badge retry, not a departure.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 text-sm text-[var(--color-text-muted)]">Weekend</div>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={attendanceForm.weekend.includes(d)} onChange={() => toggleWeekend(d)} />
                    {d}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                After changing rules use &apos;Recompute&apos; on the Attendance page to refresh the month.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button className="w-full sm:w-auto" loading={saveAttendanceMut.isPending} onClick={() => saveAttendanceMut.mutate()}>Save</Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === 'payroll' && payrollForm ? (
        <Panel>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Input label="Days per month for the daily rate" type="number" value={payrollForm.daysPerMonthForDailyRate} onChange={(e) => setPayrollForm({ ...payrollForm, daysPerMonthForDailyRate: Number(e.target.value) })} />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  basic ÷ this = daily rate; daily ÷ required hours = hourly rate
                </p>
              </div>
              <Input label="Annual leaves (days / year)" type="number" value={payrollForm.annualLeaveDaysPerYear} onChange={(e) => setPayrollForm({ ...payrollForm, annualLeaveDaysPerYear: Number(e.target.value) })} />
              <Input label="Overtime × work day" type="number" step="0.01" value={payrollForm.overtimeWorkDayMultiplier} onChange={(e) => setPayrollForm({ ...payrollForm, overtimeWorkDayMultiplier: Number(e.target.value) })} />
              <Input label="Overtime × weekend" type="number" step="0.01" value={payrollForm.overtimeWeekendMultiplier} onChange={(e) => setPayrollForm({ ...payrollForm, overtimeWeekendMultiplier: Number(e.target.value) })} />
              <Input label="Overtime × holiday" type="number" step="0.01" value={payrollForm.overtimeHolidayMultiplier} onChange={(e) => setPayrollForm({ ...payrollForm, overtimeHolidayMultiplier: Number(e.target.value) })} />
              <Input label="Prepare payroll (days before month end)" type="number" value={payrollForm.preparePayrollDaysBeforeMonthEnd} onChange={(e) => setPayrollForm({ ...payrollForm, preparePayrollDaysBeforeMonthEnd: Number(e.target.value) })} />
            </div>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Kuwait Labour Law defaults: 125% on work days, 150% on the weekly rest day, 200% on public holidays.
            </p>
            <div className="mt-6 flex justify-end">
              <Button className="w-full sm:w-auto" loading={savePayrollMut.isPending} onClick={() => savePayrollMut.mutate()}>Save</Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === 'holidays' ? (
        <Panel>
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
            <h3 className="text-sm font-semibold tracking-tight">Holidays</h3>
            <Button size="sm" onClick={() => setHolidayModal(true)}>
              Add holiday
            </Button>
          </div>
          {holidaysQ.isError ? (
            <div className="p-4">
              <ErrorBanner onRetry={() => holidaysQ.refetch()} />
            </div>
          ) : null}
          <DataTable
            columns={holidayColumns}
            rows={holidaysQ.data?.data}
            loading={holidaysQ.isLoading}
            refreshing={holidaysQ.isFetching && !holidaysQ.isLoading}
            mobileCards={false}
            empty={<EmptyState title="No holidays added yet." />}
          />
        </Panel>
      ) : null}

      {tab === 'devices' ? (
        <Panel>
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
            <h3 className="text-sm font-semibold tracking-tight">ZKTeco terminals</h3>
            <Button
              size="sm"
              onClick={() => {
                setDeviceEditing(null);
                setDeviceForm({ name: '', ip: '', port: 4370 });
                setDeviceModal(true);
              }}
            >
              Add
            </Button>
          </div>
          <p className="border-b border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            Punches are pulled from each terminal every 30 minutes over the customer&apos;s public IP (port 4370).
          </p>
          {devicesQ.isError ? (
            <div className="p-4">
              <ErrorBanner onRetry={() => devicesQ.refetch()} />
            </div>
          ) : null}
          <DataTable columns={deviceColumns} rows={devicesQ.data?.data} loading={devicesQ.isLoading} refreshing={devicesQ.isFetching && !devicesQ.isLoading} mobileCards={false} />
        </Panel>
      ) : null}

      <Modal
        open={holidayModal}
        onClose={() => setHolidayModal(false)}
        title="Add holiday"
        footer={
          <ModalActions onCancel={() => setHolidayModal(false)} onConfirm={() => addHolidayMut.mutate()} loading={addHolidayMut.isPending} />
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} />
          <Input label="Date" type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={holidayForm.recurring} onChange={(e) => setHolidayForm({ ...holidayForm, recurring: e.target.checked })} />
            Recurring
          </label>
        </div>
      </Modal>

      <Modal
        open={deviceModal}
        onClose={() => setDeviceModal(false)}
        title={deviceEditing ? 'Edit device' : 'Add device'}
        footer={
          <ModalActions onCancel={() => setDeviceModal(false)} onConfirm={() => saveDeviceMut.mutate()} loading={saveDeviceMut.isPending} />
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} />
          <Input label="IP" value={deviceForm.ip} onChange={(e) => setDeviceForm({ ...deviceForm, ip: e.target.value })} />
          <Input label="Port" type="number" value={deviceForm.port} onChange={(e) => setDeviceForm({ ...deviceForm, port: Number(e.target.value) })} />
        </div>
      </Modal>
    </div>
  );
}
