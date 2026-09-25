import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { config } from '../config.js';
import {
  Company,
  User,
  Customer,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  JobOrder,
  ActivityLog,
  ChangeRequest,
  Invoice,
  PayrollRun,
  Holiday,
  Device,
} from '../models/index.js';
import { recomputeAttendanceMetrics, startOfDay, roundKwd } from '../utils/attendance.js';

const JOB_NATURES = [
  'Roll-up Banner',
  'Business Cards',
  'A4 Flyer',
  'Letterhead',
  'Invoice Book',
  'Sticker Sheet',
  'Menu Card',
  'Brochure Tri-fold',
  'Vehicle Wrap Panel',
  'Canvas Print',
  'Certificate',
  'ID Card',
];

const FIRST = [
  'Ahmed', 'Fatima', 'Mohammed', 'Sara', 'Ali', 'Noura', 'Hassan', 'Layla',
  'Omar', 'Huda', 'Yousef', 'Mariam', 'Khaled', 'Aisha', 'Faisal', 'Dana',
  'Tariq', 'Rania', 'Bassam', 'Noor', 'Samir', 'Lina', 'Waleed', 'Reem', 'Majid',
];
const LAST = [
  'Al-Rashidi', 'Al-Mutairi', 'Al-Sabah', 'Al-Ajmi', 'Al-Dosari', 'Al-Qahtani',
  'Al-Harbi', 'Al-Ghamdi', 'Al-Otaibi', 'Al-Zahrani', 'Al-Shammari', 'Al-Anzi',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(rand(0, copy.length - 1), 1)[0]);
  }
  return out;
}

async function clearAll() {
  const cols = [
    Company, User, Customer, Employee, AttendanceRecord, LeaveRequest,
    JobOrder, ActivityLog, ChangeRequest, Invoice, PayrollRun, Holiday, Device,
  ];
  await Promise.all(cols.map((m) => m.deleteMany({})));
}

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected. Clearing...');
  await clearAll();

  const company = await Company.create({
    name: 'A2Z Printing',
    arabicName: 'مطبعة A2Z',
    address: 'Shuwaikh Industrial, Block 1, Street 5, Kuwait',
    phone: '+965 2222 3344',
    email: 'info@a2z.kw',
    brandColor: '#3d1526',
    invoiceFooterEn: 'Thank you for your business. Payment due within stated terms.',
    invoiceFooterAr: 'شكراً لتعاملكم معنا. يرجى السداد خلال المدة المحددة.',
    invoiceDueDays: 30,
    counters: { jobOrderNext: 7041, invoiceNext: 31, employeeNext: 26 },
    attendanceRules: {
      shiftStart: '08:00',
      shiftEnd: '18:00',
      requiredHoursPerDay: 8,
      graceMinutes: 15,
      minSessionMinutes: 5,
      weekend: ['Friday'],
    },
    payrollRules: {
      daysPerMonthForDailyRate: 26,
      annualLeaveDaysPerYear: 30,
      overtimeWorkDayMultiplier: 1.25,
      overtimeWeekendMultiplier: 1.5,
      overtimeHolidayMultiplier: 2,
      preparePayrollDaysBeforeMonthEnd: 3,
    },
  });

  const passwordHash = await bcrypt.hash('password123', 10);
  const [owner, supervisor] = await User.create([
    {
      name: 'Abdullah Al-Harbi',
      email: 'owner@a2z.kw',
      passwordHash,
      role: 'owner',
      companyId: company._id,
    },
    {
      name: 'Salem Al-Mutairi',
      email: 'supervisor@a2z.kw',
      passwordHash,
      role: 'supervisor',
      companyId: company._id,
    },
  ]);

  await Holiday.create([
    { name: 'National Day', date: new Date('2026-02-25'), recurring: true, companyId: company._id },
    { name: 'Liberation Day', date: new Date('2026-02-26'), recurring: true, companyId: company._id },
    { name: 'Eid Al-Fitr', date: new Date('2026-03-20'), recurring: false, companyId: company._id },
  ]);

  await Device.create([
    {
      name: 'Main Gate ZKTeco',
      ip: '192.168.1.12',
      port: 4370,
      status: 'inactive',
      lastSyncAt: dayjs().subtract(2, 'hour').toDate(),
      lastSyncNote: 'Waiting for first sync',
      companyId: company._id,
    },
    {
      name: 'Press Floor Terminal',
      ip: '192.168.1.14',
      port: 4370,
      status: 'inactive',
      lastSyncNote: 'Waiting for first sync',
      companyId: company._id,
    },
  ]);

  const customerData = [
    { name: 'Cash Customer', company: '', note: 'Walk-in sales' },
    { name: 'Kuwait Oil Company', company: 'KOC', phone: '+965 2398 1000' },
    { name: 'Al-Ghanim Industries', company: 'Al-Ghanim', phone: '+965 2242 3000' },
    { name: 'Gulf Bank Marketing', company: 'Gulf Bank', phone: '+965 2244 4444' },
    { name: 'NBK Events', company: 'National Bank of Kuwait', phone: '+965 2224 7111' },
    { name: 'Zain Retail', company: 'Zain Kuwait', phone: '+965 9444 0444' },
    { name: 'Ooredoo Brand', company: 'Ooredoo', phone: '+965 180 5555' },
    { name: 'Al-Sayer Group', company: 'Al-Sayer', phone: '+965 2484 0000' },
    { name: 'City Centre Promotions', company: 'City Centre', phone: '+965 2259 7777' },
    { name: 'Boubyan Bank', company: 'Boubyan', phone: '+965 2232 5000' },
    { name: 'KFH Marketing', company: 'Kuwait Finance House', phone: '+965 1800 333' },
    { name: 'Marina Mall Ops', company: 'Marina Mall', phone: '+965 2225 0000' },
    { name: 'Al-Salam Hospital', company: 'Al-Salam', phone: '+965 1830 000' },
  ];
  const customers = await Customer.insertMany(
    customerData.map((c) => ({ ...c, companyId: company._id }))
  );

  const titles = [
    'Press Operator', 'Finishing Lead', 'Designer', 'Sales Executive',
    'Store Keeper', 'Driver', 'Supervisor Floor', 'Quality Check',
  ];
  const employees = [];
  for (let i = 1; i <= 25; i++) {
    employees.push({
      employeeNo: String(i).padStart(4, '0'),
      name: `${pick(FIRST)} ${pick(LAST)}`,
      arabicName: `موظف ${i}`,
      jobTitle: pick(titles),
      phone: `+965 9${rand(1000000, 9999999)}`,
      deviceId: String(1000 + i),
      civilId: `2${rand(80, 99)}${rand(10000000, 99999999)}`,
      hireDate: dayjs().subtract(rand(6, 60), 'month').toDate(),
      basicSalaryKwd: roundKwd(rand(220, 480) + Math.random()),
      status: i <= 23 ? 'active' : 'inactive',
      companyId: company._id,
    });
  }
  const empDocs = await Employee.insertMany(employees);
  const activeEmps = empDocs.filter((e) => e.status === 'active');

  // Attendance for current month (Sep 2026 per user_info) + previous month
  const rules = company.attendanceRules;
  const months = [
    { y: 2026, m: 8 },
    { y: 2026, m: 9 },
  ];
  const attBulk = [];
  for (const { y, m } of months) {
    const start = dayjs(`${y}-${String(m).padStart(2, '0')}-01`);
    const daysInMonth = start.daysInMonth();
    const today = dayjs('2026-09-24');
    for (const emp of activeEmps) {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = start.date(d);
        if (m === 9 && date.isAfter(today, 'day')) continue;
        const weekday = date.format('dddd');
        const dayStart = startOfDay(date.toDate());
        if (rules.weekend.includes(weekday)) {
          attBulk.push({
            employee: emp._id,
            date: dayStart,
            status: 'off',
            companyId: company._id,
            source: 'device',
          });
          continue;
        }
        const roll = Math.random();
        if (roll < 0.08) {
          attBulk.push({
            employee: emp._id,
            date: dayStart,
            status: 'absent',
            companyId: company._id,
            source: 'device',
          });
          continue;
        }
        const lateBias = Math.random() < 0.18;
        const checkIn = date
          .hour(8)
          .minute(lateBias ? rand(16, 45) : rand(0, 14))
          .second(0)
          .toDate();
        const ot = Math.random() < 0.25;
        const checkOut = date
          .hour(ot ? rand(18, 20) : 17)
          .minute(rand(0, 59))
          .second(0)
          .toDate();
        const draft = {
          employee: emp._id,
          date: dayStart,
          status: 'present',
          checkIn,
          checkOut,
          deviceCheckIn: checkIn,
          deviceCheckOut: checkOut,
          source: 'device',
          companyId: company._id,
        };
        Object.assign(draft, recomputeAttendanceMetrics(draft, rules));
        attBulk.push(draft);
      }
    }
  }
  await AttendanceRecord.insertMany(attBulk);
  console.log(`Attendance records: ${attBulk.length}`);

  // Leave requests
  const leaveTypes = ['annual', 'sick_full_pay', 'permission_hours', 'unpaid'];
  const leaves = [];
  for (let i = 0; i < 12; i++) {
    const emp = pick(activeEmps);
    const type = leaveTypes[i % 4];
    const from = dayjs('2026-09-01').add(rand(0, 20), 'day');
    const isPerm = type === 'permission_hours';
    const statuses = ['pending', 'pending', 'approved', 'approved', 'rejected'];
    const status = statuses[i % statuses.length];
    leaves.push({
      employee: emp._id,
      type,
      from: from.toDate(),
      to: isPerm ? from.toDate() : from.add(rand(1, 4), 'day').toDate(),
      unit: isPerm ? 'hours' : 'days',
      amount: isPerm ? rand(1, 4) : rand(1, 5),
      reason: isPerm ? 'Personal errand' : 'Family / medical',
      status,
      requestedBy: supervisor._id,
      decidedBy: status === 'pending' ? undefined : owner._id,
      decidedAt: status === 'pending' ? undefined : from.toDate(),
      companyId: company._id,
    });
  }
  await LeaveRequest.insertMany(leaves);

  // Job orders ~40
  const jobOrders = [];
  for (let i = 0; i < 40; i++) {
    const customer = pick(customers);
    const status = i < 8 ? 'new' : i < 18 ? 'in_press' : 'done';
    const date = dayjs('2026-09-24').subtract(rand(0, 45), 'day').toDate();
    jobOrders.push({
      jobOrderNo: 7001 + i,
      date,
      customer: customer._id,
      createdBy: i % 3 === 0 ? owner._id : supervisor._id,
      jobNature: pick(JOB_NATURES),
      actualSize: `${rand(40, 120)}x${rand(50, 200)} cm`,
      printingSize: pick(['Digital', '50x70', '100x70']),
      numberOfCopies: rand(1, 6),
      inkColour: pick(['Full colour', 'Black', 'CMYK + Spot']),
      printingQty: rand(50, 2000),
      qtyRequired: rand(50, 2000),
      kindOfPaper: pick(['Art card 350g', 'Gloss 150g', 'Matt 200g', 'Bond 80g']),
      paperSize: pick(['70x100', 'A4', 'A3', 'SRA3']),
      options: {
        lamination: Math.random() > 0.5,
        rope: Math.random() > 0.7,
        oneSide: Math.random() > 0.4,
        twoSide: Math.random() > 0.6,
        digital: Math.random() > 0.3,
        size50x70: Math.random() > 0.7,
        size100x70: Math.random() > 0.8,
      },
      copies: { c1: 'Client', c2: 'Accounts', c3: 'Press' },
      remarks: Math.random() > 0.6 ? 'Rush job - confirm proof before press.' : '',
      materials: [
        { name: 'Art card 350g 70x100', qty: rand(1, 5), unit: 'ream' },
        { name: 'Lamination film', qty: 1, unit: 'roll' },
      ],
      status,
      companyId: company._id,
    });
  }
  const joDocs = await JobOrder.insertMany(jobOrders);

  await ActivityLog.insertMany(
    joDocs.slice(0, 20).map((jo) => ({
      entityType: 'job_order',
      entityId: jo._id,
      action: 'created',
      by: jo.createdBy,
      at: jo.createdAt,
      meta: { jobOrderNo: jo.jobOrderNo },
      companyId: company._id,
    }))
  );

  // A few pending change requests
  await ChangeRequest.insertMany([
    {
      entityType: 'job_order',
      entityId: joDocs[0]._id,
      requestedBy: supervisor._id,
      changes: { qtyRequired: 500, remarks: 'Increase qty per client call' },
      status: 'pending',
      companyId: company._id,
    },
    {
      entityType: 'job_order',
      entityId: joDocs[2]._id,
      requestedBy: supervisor._id,
      changes: { inkColour: 'Full colour + Gold' },
      status: 'pending',
      companyId: company._id,
    },
  ]);

  // Invoices ~30 from done/in_press JOs
  const invoiceable = joDocs.filter((j) => j.status !== 'new').slice(0, 30);
  const invoices = [];
  for (let i = 0; i < invoiceable.length; i++) {
    const jo = invoiceable[i];
    const total = roundKwd(rand(80, 1800) + Math.random());
    const dueDate = dayjs(jo.date).add(30, 'day').toDate();
    let paid = 0;
    let status = 'unpaid';
    const payments = [];
    const roll = Math.random();
    if (roll < 0.35) {
      paid = total;
      status = 'paid';
      payments.push({
        amount: total,
        date: dayjs(jo.date).add(rand(5, 25), 'day').toDate(),
        method: pick(['Cash', 'Bank transfer', 'Card', 'Cheque']),
        note: '',
      });
    } else if (roll < 0.55) {
      paid = roundKwd(total * 0.4);
      status = 'partial';
      payments.push({
        amount: paid,
        date: dayjs(jo.date).add(10, 'day').toDate(),
        method: 'Bank transfer',
        note: 'Partial',
      });
    }
    // some unpaid with past due - overdue at read time
    if (status !== 'paid' && i % 4 === 0) {
      // force older due dates
    }
    invoices.push({
      invoiceNo: i + 1,
      date: jo.date,
      dueDate: i % 5 === 0 ? dayjs('2026-09-10').subtract(rand(1, 20), 'day').toDate() : dueDate,
      customer: jo.customer,
      jobOrder: jo._id,
      total,
      paid,
      balance: roundKwd(total - paid),
      status,
      payments,
      companyId: company._id,
    });
  }
  const invDocs = await Invoice.insertMany(invoices);
  for (let i = 0; i < invDocs.length; i++) {
    await JobOrder.findByIdAndUpdate(invoiceable[i]._id, { invoice: invDocs[i]._id });
  }

  // Payroll runs - August approved, September draft
  async function buildLines(month, year) {
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const end = start.endOf('month');
    const records = await AttendanceRecord.find({
      date: { $gte: start.toDate(), $lte: end.toDate() },
    }).lean();
    const byEmp = {};
    for (const r of records) {
      const id = r.employee.toString();
      if (!byEmp[id]) byEmp[id] = { present: 0, ot: 0, sf: 0 };
      if (r.status === 'present') byEmp[id].present += 1;
      byEmp[id].ot += r.overtimeMinutes || 0;
      byEmp[id].sf += r.shortfallMinutes || 0;
    }
    const daysPerMonth = 26;
    const requiredHours = 8;
    return activeEmps.map((e) => {
      const s = byEmp[e._id.toString()] || { present: 0, ot: 0, sf: 0 };
      const basic = e.basicSalaryKwd;
      const dailyRate = roundKwd(basic / daysPerMonth);
      const hourlyRate = roundKwd(dailyRate / requiredHours);
      const overtimePay = roundKwd((s.ot / 60) * hourlyRate * 1.25);
      const deductions = roundKwd((s.sf / 60) * hourlyRate);
      return {
        employee: e._id,
        basicSalary: basic,
        dailyRate,
        hourlyRate,
        daysPresent: s.present,
        overtimePay,
        deductions,
        netPay: roundKwd(basic + overtimePay - deductions),
      };
    });
  }

  const augLines = await buildLines(8, 2026);
  const sepLines = await buildLines(9, 2026);
  await PayrollRun.create([
    {
      month: 8,
      year: 2026,
      status: 'approved',
      totalNet: roundKwd(augLines.reduce((s, l) => s + l.netPay, 0)),
      lines: augLines,
      computedAt: new Date('2026-08-28'),
      approvedBy: owner._id,
      approvedAt: new Date('2026-08-29'),
      companyId: company._id,
    },
    {
      month: 9,
      year: 2026,
      status: 'draft',
      totalNet: roundKwd(sepLines.reduce((s, l) => s + l.netPay, 0)),
      lines: sepLines,
      computedAt: new Date(),
      companyId: company._id,
    },
  ]);

  console.log('Seed complete.');
  console.log('Login: owner@a2z.kw / password123');
  console.log('Login: supervisor@a2z.kw / password123');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
