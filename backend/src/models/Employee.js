import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    employeeNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    arabicName: String,
    jobTitle: String,
    phone: String,
    deviceId: String,
    civilId: String,
    hireDate: { type: Date, required: true },
    basicSalaryKwd: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    note: String,
  },
  { timestamps: true }
);

employeeSchema.index({ deviceId: 1 });
employeeSchema.index({ name: 'text' });

export const Employee = mongoose.model('Employee', employeeSchema);
