import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import dayjs from 'dayjs';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { Modal, ModalActions } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  Card,
  StatusPill,
  SegmentedTabs,
  Input,
  ErrorBanner,
  EmptyState,
  IconButton,
  PageLoader,
} from '../../components/ui';

const STATUS_TABS = [
  { value: 'new', label: 'New' },
  { value: 'in_press', label: 'In press' },
  { value: 'done', label: 'Done' },
];

const FINISHING_LABELS = {
  lamination: 'Lamination',
  rope: 'Rope',
  oneSide: 'One side',
  twoSide: 'Two side',
  digital: 'Digital',
  size50x70: '50×70',
  size100x70: '100×70',
};

function dash(v) {
  return v != null && v !== '' ? v : '-';
}

function activityText(entry, jobOrderNo) {
  const who = entry.by?.name ? ` - ${entry.by.name}` : '';
  switch (entry.action) {
    case 'created':
      return `Job order ${jobOrderNo} created${who}`;
    case 'status_changed':
      return `Status changed to ${entry.meta?.to?.replace('_', ' ') || ''}${who}`;
    case 'updated':
      return `Job order updated${who}`;
    case 'invoice_created':
      return `Invoice INV-${entry.meta?.invoiceNo} created${who}`;
    case 'change_request_approved':
      return `Change request approved${who}`;
    default:
      return `${entry.action}${who}`;
  }
}

function FieldGrid({ jo }) {
  const finishing = Object.entries(jo.options || {})
    .filter(([, v]) => v)
    .map(([k]) => FINISHING_LABELS[k] || k)
    .join(', ');

  const copies = jo.copies
    ? Object.values(jo.copies)
        .filter(Boolean)
        .join(', ')
    : '';

  const fields = [
    ['Customer', jo.customer?.name],
    ['Company', jo.customer?.company],
    ['Tel', jo.customer?.phone],
    ['Job nature', jo.jobNature],
    ['Actual size', jo.actualSize],
    ['Printing size', jo.printingSize],
    ['No. of copies', jo.numberOfCopies],
    ['Ink colour', jo.inkColour],
    ['Printing qty', jo.printingQty],
    ['Qty required', jo.qtyRequired],
    ['Kind of paper', jo.kindOfPaper],
    ['Paper size', jo.paperSize],
    ['Copies', copies],
    ['Numbering from', jo.numberingFrom],
    ['Perforating', jo.perforating],
    ['Gumming', jo.gumming],
    ['Stitching', jo.stitching],
    ['Cover No.', jo.coverNo],
    ['Cover colour', jo.coverColour],
    ['Lamination', finishing],
    ['Gold stamping', jo.goldStamping],
    ['Remarks', jo.remarks],
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label}>
          <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
          <div className="text-sm">{dash(value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function JobOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { isOwner } = useAuth();
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ total: '', dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD') });
  const [invoiceError, setInvoiceError] = useState('');

  const q = useQuery({
    queryKey: ['job-order', id],
    queryFn: async () => (await api.get(`/job-orders/${id}`)).data,
  });

  const jo = q.data;

  const statusMut = useMutation({
    mutationFn: async (status) => (await api.patch(`/job-orders/${id}/status`, { status })).data,
    onMutate: async (status) => {
      await qc.cancelQueries({ queryKey: ['job-order', id] });
      const prev = qc.getQueryData(['job-order', id]);
      qc.setQueryData(['job-order', id], (old) => (old ? { ...old, status } : old));
      return { prev };
    },
    onError: (_err, _status, ctx) => {
      if (ctx?.prev) qc.setQueryData(['job-order', id], ctx.prev);
      toast.error(getErrorMessage(_err));
    },
    onSuccess: () => toast.success('Status updated'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['job-order', id] }),
  });

  const approveMut = useMutation({
    mutationFn: async (crId) => (await api.patch(`/change-requests/${crId}/approve`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-order', id] });
      toast.success('Change request approved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMut = useMutation({
    mutationFn: async (crId) => (await api.patch(`/change-requests/${crId}/reject`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-order', id] });
      toast.success('Change request rejected');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const invoiceMut = useMutation({
    mutationFn: async (payload) =>
      (await api.post('/invoices', { jobOrderId: id, ...payload })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['job-order', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceModal(false);
      toast.success('Invoice created');
      navigate(`/invoices/${data._id}`);
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setInvoiceError(msg);
      toast.error(msg);
    },
  });

  if (q.isLoading) {
    return <PageLoader label="Loading job order..." />;
  }

  if (q.isError || !jo) return <ErrorBanner onRetry={() => q.refetch()} />;

  const invoiceId = jo.invoice?._id || jo.invoice;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={`Job order ${jo.jobOrderNo}`}
        subtitle={`${formatDate(jo.date)} - ${jo.createdBy?.name} (${jo.createdBy?.role})`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/job-orders')}>
              Back
            </Button>
            <IconButton
              label="Print"
              onClick={() => window.open(`/job-orders/${id}/print`, '_blank')}
            >
              <Printer size={16} />
            </IconButton>
            <Button variant="secondary" onClick={() => navigate(`/job-orders/${id}/edit`)}>
              Edit
            </Button>
            {invoiceId ? (
              <Button onClick={() => navigate(`/invoices/${invoiceId}`)}>View invoice</Button>
            ) : (
              <Button onClick={() => setInvoiceModal(true)}>Create invoice</Button>
            )}
          </div>
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <StatusPill status={jo.status} />
          <SegmentedTabs
            className="w-full sm:w-auto"
            options={STATUS_TABS}
            value={jo.status}
            onChange={(v) => statusMut.mutate(v)}
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Details">
            <FieldGrid jo={jo} />
          </Card>
          <Card title="MATERIALS">
            {jo.materials?.length ? (
              <ul className="space-y-1 text-sm">
                {jo.materials.map((m, i) => (
                  <li key={i}>
                    {m.name} - <span className="num">{m.qty}</span> {m.unit}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">-</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Change requests">
            {jo.changeRequests?.length ? (
              <ul className="space-y-3">
                {jo.changeRequests.map((cr) => (
                  <li key={cr._id} className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    <div className="text-[var(--color-text-muted)]">
                      Requested by {cr.requestedBy?.name} ({cr.requestedBy?.role})
                    </div>
                    <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                      {JSON.stringify(cr.changes, null, 2)}
                    </pre>
                    {isOwner ? (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          loading={approveMut.isPending}
                          onClick={() => approveMut.mutate(cr._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={rejectMut.isPending}
                          onClick={() => rejectMut.mutate(cr._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No records" />
            )}
          </Card>

          <Card title="Activity">
            {jo.activity?.length ? (
              <ul className="space-y-3 text-sm">
                {jo.activity.map((a) => (
                  <li key={a._id} className="border-b border-[var(--color-border)] pb-2 last:border-0">
                    <div>{activityText(a, jo.jobOrderNo)}</div>
                    <div className="subline">{formatDateTime(a.at)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity yet" />
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={invoiceModal}
        onClose={() => setInvoiceModal(false)}
        title="Create invoice"
        footer={
          <ModalActions
            onCancel={() => setInvoiceModal(false)}
            confirmLabel="Create invoice"
            onConfirm={() =>
              invoiceMut.mutate({
                total: Number(invoiceForm.total),
                dueDate: invoiceForm.dueDate,
              })
            }
            loading={invoiceMut.isPending}
          />
        }
      >
        {invoiceError ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {invoiceError}
          </div>
        ) : null}
        <div className="space-y-3">
          <div className="text-sm text-[var(--color-text-muted)]">
            Job order #{jo.jobOrderNo} - {jo.customer?.name}
          </div>
          <Input
            label="Total (KWD)"
            type="number"
            step="0.001"
            value={invoiceForm.total}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, total: e.target.value })}
          />
          <Input
            label="Due date"
            type="date"
            value={invoiceForm.dueDate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
