import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: { type: String, required: true },
    arabicName: String,
    address: String,
    phone: String,
    email: String,
    logoUrl: String,
    brandColor: { type: String, default: '#111111' },
    invoiceFooterEn: String,
    invoiceFooterAr: String,
    invoiceDueDays: { type: Number, default: 30 },
    counters: {
      jobOrderNext: { type: Number, default: 7001 },
      invoiceNext: { type: Number, default: 1 },
      employeeNext: { type: Number, default: 1 },
    },
    attendanceRules: {
      shiftStart: { type: String, default: '08:00' },
      shiftEnd: { type: String, default: '18:00' },
      requiredHoursPerDay: { type: Number, default: 8 },
      graceMinutes: { type: Number, default: 15 },
      minSessionMinutes: { type: Number, default: 5 },
      weekend: { type: [String], default: ['Friday'] },
    },
    payrollRules: {
      daysPerMonthForDailyRate: { type: Number, default: 26 },
      annualLeaveDaysPerYear: { type: Number, default: 30 },
      overtimeWorkDayMultiplier: { type: Number, default: 1.25 },
      overtimeWeekendMultiplier: { type: Number, default: 1.5 },
      overtimeHolidayMultiplier: { type: Number, default: 2 },
      preparePayrollDaysBeforeMonthEnd: { type: Number, default: 3 },
    },
  },
  { timestamps: true }
);

export async function nextCounter(companyId, field) {
  const path = `counters.${field}`;
  const doc = await Company.findOneAndUpdate(
    { _id: companyId },
    { $inc: { [path]: 1 } },
    { returnDocument: 'before' }
  );
  if (!doc) throw new Error('Company not found for counter');
  return doc.counters[field];
}

export const Company = mongoose.model('Company', companySchema);
