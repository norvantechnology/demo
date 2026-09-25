import mongoose from 'mongoose';

const payrollRunSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
    totalNet: { type: Number, required: true },
    lines: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        basicSalary: Number,
        dailyRate: Number,
        hourlyRate: Number,
        daysPresent: Number,
        overtimePay: Number,
        deductions: Number,
        netPay: Number,
      },
    ],
    computedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { timestamps: true }
);

payrollRunSchema.index({ year: 1, month: 1 }, { unique: true });

export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
