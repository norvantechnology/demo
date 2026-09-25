import { Router } from 'express';
import dayjs from 'dayjs';
import {
  PayrollRun,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  Company,
} from '../models/index.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';
import { roundKwd } from '../utils/attendance.js';

const router = Router();

async function computePayrollLines(month, year, company) {
  const rules = company.payrollRules || {};
  const attRules = company.attendanceRules || {};
  const daysPerMonth = rules.daysPerMonthForDailyRate || 26;
  const requiredHours = attRules.requiredHoursPerDay || 8;
  const otMult = rules.overtimeWorkDayMultiplier || 1.25;

  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
  const end = start.endOf('month');

  const employees = await Employee.find({ status: 'active' }).lean();
  const records = await AttendanceRecord.find({
    date: { $gte: start.toDate(), $lte: end.toDate() },
  }).lean();
  const unpaidLeaves = await LeaveRequest.find({
    type: 'unpaid',
    status: 'approved',
    from: { $lte: end.toDate() },
    to: { $gte: start.toDate() },
  }).lean();

  const byEmp = {};
  for (const r of records) {
    const id = r.employee.toString();
    if (!byEmp[id]) byEmp[id] = { present: 0, overtimeMinutes: 0, shortfallMinutes: 0 };
    if (r.status === 'present') byEmp[id].present += 1;
    byEmp[id].overtimeMinutes += r.overtimeMinutes || 0;
    byEmp[id].shortfallMinutes += r.shortfallMinutes || 0;
  }

  const unpaidDays = {};
  for (const l of unpaidLeaves) {
    const id = l.employee.toString();
    unpaidDays[id] = (unpaidDays[id] || 0) + (l.amount || 0);
  }

  return employees.map((e) => {
    const stats = byEmp[e._id.toString()] || {
      present: 0,
      overtimeMinutes: 0,
      shortfallMinutes: 0,
    };
    const basic = e.basicSalaryKwd || 0;
    const dailyRate = roundKwd(basic / daysPerMonth);
    const hourlyRate = roundKwd(dailyRate / requiredHours);
    const overtimePay = roundKwd((stats.overtimeMinutes / 60) * hourlyRate * otMult);
    const shortfallDeduction = roundKwd((stats.shortfallMinutes / 60) * hourlyRate);
    const unpaidDeduction = roundKwd((unpaidDays[e._id.toString()] || 0) * dailyRate);
    const deductions = roundKwd(shortfallDeduction + unpaidDeduction);
    const netPay = roundKwd(basic + overtimePay - deductions);
    return {
      employee: e._id,
      basicSalary: basic,
      dailyRate,
      hourlyRate,
      daysPresent: stats.present,
      overtimePay,
      deductions,
      netPay,
    };
  });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const [data, total] = await Promise.all([
      PayrollRun.find()
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .select('month year status totalNet computedAt')
        .lean(),
      PayrollRun.countDocuments(),
    ]);
    res.json(paginated(data, total, page, limit));
  })
);

router.post(
  '/',
  requireOwner,
  asyncHandler(async (req, res) => {
    const month = Number(req.body?.month);
    const year = Number(req.body?.year);
    if (!month || !year) throw Errors.validation('Month and year required');

    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');

    const existing = await PayrollRun.findOne({ month, year });
    if (existing && existing.status !== 'draft') {
      throw Errors.conflict('Payroll for this period is already approved/paid');
    }

    const lines = await computePayrollLines(month, year, company);
    const totalNet = roundKwd(lines.reduce((s, l) => s + l.netPay, 0));

    let doc;
    if (existing) {
      existing.lines = lines;
      existing.totalNet = totalNet;
      existing.computedAt = new Date();
      await existing.save();
      doc = existing;
    } else {
      doc = await PayrollRun.create({
        month,
        year,
        status: 'draft',
        totalNet,
        lines,
        computedAt: new Date(),
        companyId: company._id,
      });
    }
    res.status(201).json(doc);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await PayrollRun.findById(req.params.id)
      .populate('lines.employee', 'name employeeNo')
      .populate('approvedBy', 'name role')
      .lean();
    if (!doc) throw Errors.notFound('Payroll run not found');
    res.json(doc);
  })
);

router.patch(
  '/:id/approve',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await PayrollRun.findById(req.params.id);
    if (!doc) throw Errors.notFound('Payroll run not found');
    if (doc.status !== 'draft') throw Errors.conflict('Only draft can be approved');
    doc.status = 'approved';
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    await doc.save();
    res.json(doc);
  })
);

router.patch(
  '/:id/pay',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await PayrollRun.findById(req.params.id);
    if (!doc) throw Errors.notFound('Payroll run not found');
    if (doc.status !== 'approved') throw Errors.conflict('Only approved can be marked paid');
    doc.status = 'paid';
    await doc.save();
    res.json(doc);
  })
);

export default router;
