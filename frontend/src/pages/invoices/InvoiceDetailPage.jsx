import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { api, getErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Modal, ModalActions } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import {
  PageHeader,
  Button,
  StatusPill,
  CurrencyKwd,
  Input,
  Select,
  Card,
  ErrorBanner,
  TextLink,
  PageLoader,
} from '../../components/ui';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [dueEdit, setDueEdit] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    method: 'Cash',
    note: '',
  });
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const q = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get(`/invoices/${id}`)).data,
  });

  const inv = q.data;

  const paymentMut = useMutation({
    mutationFn: async (payload) => (await api.post(`/invoices/${id}/payments`, payload)).data,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ['invoice', id] });
      const prev = qc.getQueryData(['invoice', id]);
      const amt = Number(payload.amount) || 0;
      qc.setQueryData(['invoice', id], (old) => {
        if (!old) return old;
        const paid = (old.paid || 0) + amt;
        const balance = Math.max(0, old.total - paid);
        let status = 'partial';
        if (paid <= 0) status = 'unpaid';
        if (paid >= old.total) status = 'paid';
        return {
          ...old,
          paid,
          balance,
          status,
          displayStatus: status,
          payments: [
            ...(old.payments || []),
            { amount: amt, date: payload.date, method: payload.method, note: payload.note },
          ],
        };
      });
      return { prev };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(['invoice', id], ctx.prev);
      const msg = getErrorMessage(_err);
      setError(msg);
      toast.error(msg);
    },
    onSuccess: () => {
      setPaymentOpen(false);
      setPaymentForm({ amount: '', date: dayjs().format('YYYY-MM-DD'), method: 'Cash', note: '' });
      toast.success('Payment recorded');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const dueMut = useMutation({
    mutationFn: async (d) => (await api.patch(`/invoices/${id}`, { dueDate: d })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      setDueEdit(false);
      toast.success('Due date updated');
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    },
  });

  if (q.isLoading) {
    return <PageLoader label="Loading invoice..." />;
  }

  if (q.isError || !inv) return <ErrorBanner onRetry={() => q.refetch()} />;

  const paymentColumns = [
    { key: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (r) => <CurrencyKwd value={r.amount} />,
    },
    { key: 'method', header: 'Method', cell: (r) => r.method },
    { key: 'note', header: 'Note', cell: (r) => r.note || '-' },
  ];

  const subtitle = [
    inv.customer?.name,
    inv.customer?.company ? inv.customer.company : null,
  ]
    .filter(Boolean)
    .join(' - ');

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title={`INV-${inv.invoiceNo}`} subtitle={subtitle || undefined}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={inv.displayStatus || inv.status} />
            {inv.jobOrder ? (
              <TextLink to={`/job-orders/${inv.jobOrder._id || inv.jobOrder}`}>
                JO #{inv.jobOrder.jobOrderNo || inv.jobOrder}
              </TextLink>
            ) : null}
          </div>
          <div className="text-xl font-bold sm:text-2xl">
            Balance: <CurrencyKwd value={inv.balance} />
          </div>
        </div>
      </PageHeader>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button className="w-full sm:w-auto" onClick={() => setPaymentOpen(true)}>
          Record payment
        </Button>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => {
            setDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : '');
            setDueEdit(true);
          }}
        >
          Edit due date
        </Button>
      </div>

      <Card title="Payments history" noPadding>
        <DataTable columns={paymentColumns} rows={inv.payments || []} empty={null} />
        {!inv.payments?.length ? (
          <p className="px-4 pb-4 text-sm text-[var(--color-text-muted)]">No payments recorded.</p>
        ) : null}
      </Card>

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record payment"
        footer={
          <ModalActions
            onCancel={() => setPaymentOpen(false)}
            confirmLabel="Save payment"
            onConfirm={() =>
              paymentMut.mutate({
                amount: Number(paymentForm.amount),
                date: paymentForm.date,
                method: paymentForm.method,
                note: paymentForm.note,
              })
            }
            loading={paymentMut.isPending}
          />
        }
      >
        <div className="space-y-3">
          <Input
            label="Amount (KWD)"
            type="number"
            step="0.001"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={paymentForm.date}
            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
          />
          <Select
            label="Method"
            value={paymentForm.method}
            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
          >
            <option value="Cash">Cash</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
          </Select>
          <Input
            label="Note"
            value={paymentForm.note}
            onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={dueEdit}
        onClose={() => setDueEdit(false)}
        title="Edit due date"
        footer={
          <ModalActions
            onCancel={() => setDueEdit(false)}
            onConfirm={() => dueMut.mutate(dueDate)}
            loading={dueMut.isPending}
          />
        }
      >
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </Modal>
    </div>
  );
}
