import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { PageHeader, Button, Input, TextArea, Select, Card, ErrorBanner, TextLink } from '../../components/ui';

const FINISHING = [
  { key: 'lamination', label: 'Lamination' },
  { key: 'rope', label: 'Rope' },
  { key: 'oneSide', label: 'One side' },
  { key: 'twoSide', label: 'Two side' },
  { key: 'digital', label: 'Digital' },
  { key: 'size50x70', label: '50×70' },
  { key: 'size100x70', label: '100×70' },
];

const COPY_KEYS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
const COPY_LABELS = ['1st Copy', '2nd Copy', '3rd Copy', '4th Copy', '5th Copy', '6th Copy'];

const ADDON_FIELDS = [
  { key: 'numberingFrom', label: 'Numbering from' },
  { key: 'perforating', label: 'Perforating' },
  { key: 'gumming', label: 'Gumming' },
  { key: 'stitching', label: 'Stitching' },
  { key: 'coverNo', label: 'Cover No.' },
  { key: 'coverColour', label: 'Cover colour' },
  { key: 'goldStamping', label: 'Gold stamping' },
  { key: 'embossing', label: 'Embossing' },
  { key: 'silkScreen', label: 'Silk screen' },
  { key: 'uv', label: 'UV' },
  { key: 'dieCut', label: 'Die cut' },
  { key: 'creasing', label: 'Creasing' },
];

const UNITS = ['ream', 'set', 'roll', 'sheet', 'pcs', 'kg'];

function emptyForm() {
  return {
    customer: '',
    jobNature: '',
    date: dayjs().format('YYYY-MM-DD'),
    actualSize: '',
    printingSize: 'Digital',
    numberOfCopies: 1,
    inkColour: '',
    printingQty: '',
    qtyRequired: '',
    kindOfPaper: '',
    paperSize: '',
    options: {
      lamination: false,
      rope: false,
      oneSide: false,
      twoSide: false,
      digital: false,
      size50x70: false,
      size100x70: false,
    },
    copies: { c1: '', c2: '', c3: '', c4: '', c5: '', c6: '' },
    numberingFrom: '',
    perforating: '',
    gumming: '',
    stitching: '',
    coverNo: '',
    coverColour: '',
    goldStamping: '',
    embossing: '',
    silkScreen: '',
    uv: '',
    dieCut: '',
    creasing: '',
    remarks: '',
    materials: [],
  };
}

function joToForm(jo) {
  return {
    customer: jo.customer?._id || jo.customer || '',
    jobNature: jo.jobNature || '',
    date: jo.date ? dayjs(jo.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    actualSize: jo.actualSize || '',
    printingSize: jo.printingSize || 'Digital',
    numberOfCopies: jo.numberOfCopies ?? 1,
    inkColour: jo.inkColour || '',
    printingQty: jo.printingQty ?? '',
    qtyRequired: jo.qtyRequired ?? '',
    kindOfPaper: jo.kindOfPaper || '',
    paperSize: jo.paperSize || '',
    options: { ...emptyForm().options, ...(jo.options || {}) },
    copies: { ...emptyForm().copies, ...(jo.copies || {}) },
    numberingFrom: jo.numberingFrom || '',
    perforating: jo.perforating || '',
    gumming: jo.gumming || '',
    stitching: jo.stitching || '',
    coverNo: jo.coverNo || '',
    coverColour: jo.coverColour || '',
    goldStamping: jo.goldStamping || '',
    embossing: jo.embossing || '',
    silkScreen: jo.silkScreen || '',
    uv: jo.uv || '',
    dieCut: jo.dieCut || '',
    creasing: jo.creasing || '',
    remarks: jo.remarks || '',
    materials: jo.materials?.length ? [...jo.materials] : [],
  };
}

export default function JobOrderFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [customerModal, setCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  });

  const customersQ = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers', { params: { limit: 100 } })).data,
  });

  const joQ = useQuery({
    queryKey: ['job-order', id],
    queryFn: async () => (await api.get(`/job-orders/${id}`)).data,
    enabled: isEdit,
  });

  useEffect(() => {
    if (joQ.data) setForm(joToForm(joQ.data));
  }, [joQ.data]);

  const customerOptions =
    customersQ.data?.data?.map((c) => ({
      value: c._id,
      label: c.company ? `${c.name} - ${c.company}` : c.name,
    })) || [];

  const createCustomerMut = useMutation({
    mutationFn: async (payload) => (await api.post('/customers', payload)).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setForm((f) => ({ ...f, customer: data._id }));
      setCustomerModal(false);
      setNewCustomer({ name: '', company: '', phone: '', email: '', address: '', note: '' });
      toast.success('Customer added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const saveMut = useMutation({
    mutationFn: async (payload) => {
      const body = {
        ...payload,
        numberOfCopies: Number(payload.numberOfCopies) || 1,
        printingQty: payload.printingQty === '' ? undefined : Number(payload.printingQty),
        qtyRequired: Number(payload.qtyRequired),
        materials: payload.materials.filter((m) => m.name?.trim()),
      };
      if (isEdit) return (await api.patch(`/job-orders/${id}`, body)).data;
      return (await api.post('/job-orders', body)).data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['job-orders'] });
      toast.success(isEdit ? 'Job order updated' : 'Job order created');
      navigate(isEdit ? `/job-orders/${id}` : `/job-orders/${data._id}`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    },
  });

  function setOption(key, checked) {
    setForm((f) => ({ ...f, options: { ...f.options, [key]: checked } }));
  }

  function setCopy(key, value) {
    setForm((f) => ({ ...f, copies: { ...f.copies, [key]: value } }));
  }

  function addMaterial() {
    setForm((f) => ({
      ...f,
      materials: [...f.materials, { name: '', qty: 1, unit: 'pcs' }],
    }));
  }

  function updateMaterial(i, field, value) {
    setForm((f) => {
      const materials = [...f.materials];
      materials[i] = { ...materials[i], [field]: value };
      return { ...f, materials };
    });
  }

  function removeMaterial(i) {
    setForm((f) => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));
  }

  if (isEdit && joQ.isLoading) {
    return <div className="animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-32 rounded-xl bg-gray-100" />
    ))}</div>;
  }

  if (isEdit && joQ.isError) {
    return <ErrorBanner onRetry={() => joQ.refetch()} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-28">
      <PageHeader title={isEdit ? 'Edit job order' : 'New job order'} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3 sm:space-y-4">
        <Card title="Customer & Job">
          <div className="form-grid">
            <div className="span-2">
              <SearchableSelect
                label="Customer *"
                options={customerOptions}
                value={form.customer}
                onChange={(v) => setForm({ ...form, customer: v })}
                placeholder="Select customer"
                extraAction={
                  <TextLink className="w-full px-2 py-2 text-start" onClick={() => setCustomerModal(true)}>
                    + Add new customer
                  </TextLink>
                }
              />
            </div>
            <Input
              label="Job nature *"
              value={form.jobNature}
              onChange={(e) => setForm({ ...form, jobNature: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </Card>

        <Card title="Specs">
          <div className="form-grid form-grid-3">
            <Input
              label="Actual size"
              value={form.actualSize}
              onChange={(e) => setForm({ ...form, actualSize: e.target.value })}
            />
            <Select
              label="Printing size"
              value={form.printingSize}
              onChange={(e) => setForm({ ...form, printingSize: e.target.value })}
            >
              <option value="Digital">Digital</option>
              <option value="50x70">50x70</option>
              <option value="100x70">100x70</option>
            </Select>
            <Input
              label="No. of copies"
              type="number"
              value={form.numberOfCopies}
              onChange={(e) => setForm({ ...form, numberOfCopies: e.target.value })}
            />
            <Input
              label="Ink colour"
              value={form.inkColour}
              onChange={(e) => setForm({ ...form, inkColour: e.target.value })}
            />
            <Input
              label="Printing qty"
              type="number"
              value={form.printingQty}
              onChange={(e) => setForm({ ...form, printingQty: e.target.value })}
            />
            <Input
              label="Qty required *"
              type="number"
              value={form.qtyRequired}
              onChange={(e) => setForm({ ...form, qtyRequired: e.target.value })}
            />
            <Input
              label="Kind of paper"
              value={form.kindOfPaper}
              onChange={(e) => setForm({ ...form, kindOfPaper: e.target.value })}
            />
            <Input
              label="Paper size"
              value={form.paperSize}
              onChange={(e) => setForm({ ...form, paperSize: e.target.value })}
            />
          </div>
        </Card>

        <Card title="Finishing options">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 sm:gap-2.5">
            {FINISHING.map(({ key, label }) => (
              <label
                key={key}
                className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[#fafaf9] px-2.5 text-[13px] font-medium"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={form.options[key]}
                  onChange={(e) => setOption(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </Card>

        <Card title="Copy tracking">
          <div className="form-grid form-grid-3">
            {COPY_KEYS.map((key, i) => (
              <Input
                key={key}
                label={COPY_LABELS[i]}
                value={form.copies[key]}
                onChange={(e) => setCopy(key, e.target.value)}
              />
            ))}
          </div>
        </Card>

        <Card title="Additional finishing">
          <div className="form-grid form-grid-3">
            {ADDON_FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}
          </div>
        </Card>

        <Card
          title="Materials"
          action={
            <TextLink onClick={addMaterial}>+ Add material</TextLink>
          }
        >
          {form.materials.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No materials added.</p>
          ) : (
            <div className="space-y-3">
              {form.materials.map((m, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <Input
                    label="Name"
                    className="min-w-[180px] flex-1"
                    value={m.name}
                    onChange={(e) => updateMaterial(i, 'name', e.target.value)}
                  />
                  <Input
                    label="Qty"
                    type="number"
                    className="w-24"
                    value={m.qty}
                    onChange={(e) => updateMaterial(i, 'qty', Number(e.target.value))}
                  />
                  <Select
                    label="Unit"
                    className="w-28"
                    value={m.unit}
                    onChange={(e) => updateMaterial(i, 'unit', e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    className="mb-1 rounded-lg p-2 text-[var(--color-danger)] hover:bg-red-50"
                    onClick={() => removeMaterial(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Remarks">
          <TextArea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </Card>
      </div>

      <div className="sticky-actions">
        <div className="mx-auto flex w-full gap-2 px-3 sm:px-6 lg:px-8 xl:px-10">
          <Button
            variant="secondary"
            className="min-w-0 flex-1 sm:flex-none"
            onClick={() => navigate(isEdit ? `/job-orders/${id}` : '/job-orders')}
          >
            Cancel
          </Button>
          <Button
            className="min-w-0 flex-[1.6] sm:flex-none"
            loading={saveMut.isPending}
            onClick={() => saveMut.mutate(form)}
          >
            Save job order
          </Button>
        </div>
      </div>

      <Modal
        open={customerModal}
        onClose={() => setCustomerModal(false)}
        title="Add customer"
        footer={
          <ModalActions
            onCancel={() => setCustomerModal(false)}
            onConfirm={() => createCustomerMut.mutate(newCustomer)}
            loading={createCustomerMut.isPending}
          />
        }
      >
        <div className="space-y-3">
          <Input
            label="Name *"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
          <Input
            label="Company"
            value={newCustomer.company}
            onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
          />
          <Input
            label="Phone"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          />
          <Input
            label="Email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          />
          <Input
            label="Address"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
          />
          <TextArea
            label="Note"
            value={newCustomer.note}
            onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
