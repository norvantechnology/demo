import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    invoiceNo: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    jobOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder', required: true },
    total: { type: Number, required: true },
    paid: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    payments: [
      {
        amount: Number,
        date: Date,
        method: String,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ date: -1, invoiceNo: -1 });
invoiceSchema.index({ jobOrder: 1 });
invoiceSchema.index({ status: 1, balance: 1 });

export function displayStatus(invoice, now = new Date()) {
  if (invoice.status === 'paid') return 'paid';
  const due = new Date(invoice.dueDate);
  if (due < now && invoice.balance > 0) return 'overdue';
  return invoice.status;
}

export const Invoice = mongoose.model('Invoice', invoiceSchema);
