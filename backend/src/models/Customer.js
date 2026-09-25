import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: { type: String, required: true },
    company: String,
    phone: String,
    email: String,
    address: String,
    note: String,
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', company: 'text', phone: 'text' });
customerSchema.index({ name: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
