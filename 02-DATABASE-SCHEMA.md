# Database Schema (MongoDB / Mongoose)

Single-tenant for the demo (one `Company` document), but model it so a `companyId` field exists
on every collection for an easy future multi-tenant upgrade. All `_id`s are ObjectId unless noted.
All collections get `createdAt`/`updatedAt` (`timestamps: true`).

---

## Company
Singleton-ish (one doc for the demo), holds branding + numbering counters.
```
Company {
  name: String, required
  arabicName: String
  address: String
  phone: String
  email: String
  logoUrl: String            // uploaded file URL
  brandColor: String         // hex, e.g. "#111111"
  invoiceFooterEn: String
  invoiceFooterAr: String
  invoiceDueDays: Number, default 30

  counters: {
    jobOrderNext: Number, default 7001
    invoiceNext: Number, default 1
    employeeNext: Number, default 1
  }

  attendanceRules: {
    shiftStart: String        // "08:00"
    shiftEnd: String          // "18:00"
    requiredHoursPerDay: Number
    graceMinutes: Number
    minSessionMinutes: Number
    weekend: [String]         // e.g. ["Friday"]
  }

  payrollRules: {
    daysPerMonthForDailyRate: Number   // e.g. 26
    annualLeaveDaysPerYear: Number     // e.g. 30
    overtimeWorkDayMultiplier: Number  // e.g. 1.25
    overtimeWeekendMultiplier: Number  // e.g. 1.5
    overtimeHolidayMultiplier: Number  // e.g. 2
    preparePayrollDaysBeforeMonthEnd: Number // e.g. 3
  }
}
```
Indexes: none needed beyond `_id` (singleton).

**Atomic numbering:** use `findOneAndUpdate({ _id }, { $inc: { "counters.jobOrderNext": 1 } },
{ returnDocument: "before" })` to hand out the next number without race conditions.

---

## User (login accounts)
```
User {
  name: String, required
  email: String, required, unique, lowercase
  passwordHash: String, required
  role: String, enum ["owner", "supervisor"], required
  active: Boolean, default true
}
```
Indexes: `{ email: 1 }` unique.

---

## Holiday
```
Holiday {
  name: String, required
  date: Date, required
  recurring: Boolean, default false   // repeats yearly on same day/month
}
```
Indexes: `{ date: 1 }`.

---

## Device (attendance terminals)
```
Device {
  name: String, required
  ip: String, required
  port: Number, default 4370
  lastSyncAt: Date
  lastSyncNote: String        // e.g. "Demo: no live device connected yet"
  status: String, enum ["active", "inactive"], default "inactive"
}
```

---

## Customer
```
Customer {
  name: String, required
  company: String
  phone: String
  email: String
  address: String
  note: String
}
```
Indexes: `{ name: "text", company: "text", phone: "text" }` for search;
`{ name: 1 }` for sort.
Denormalize `jobOrderCount` and `outstandingBalance` is NOT stored on the doc — compute via
aggregation on read (see API spec `GET /customers`) to avoid drift; cache result for 30s if needed
for demo speed.

Special row: a single seeded "Cash Customer" document with no phone/company, used for walk-in
sales (still a normal Customer row, just sparse fields).

---

## Employee
```
Employee {
  employeeNo: String, required, unique   // "0001" zero-padded, from Company.counters.employeeNext
  name: String, required
  arabicName: String
  jobTitle: String
  phone: String
  deviceId: String            // "User ID" on the fingerprint terminal, links attendance punches
  civilId: String
  hireDate: Date, required
  basicSalaryKwd: Number, required
  status: String, enum ["active", "inactive"], default "active"
  note: String
}
```
Indexes: `{ employeeNo: 1 }` unique, `{ deviceId: 1 }` (used to match punches),
`{ name: "text" }`.

---

## AttendanceRecord (one per employee per day)
```
AttendanceRecord {
  employee: ObjectId -> Employee, required
  date: Date, required                 // normalized to midnight
  status: String, enum ["present", "absent", "off"], required
  checkIn: Date
  checkOut: Date
  workedMinutes: Number, default 0
  lateMinutes: Number, default 0
  overtimeMinutes: Number, default 0
  shortfallMinutes: Number, default 0
  source: String, enum ["device", "manual"], default "device"
  note: String
}
```
Indexes: `{ employee: 1, date: 1 }` unique compound (one record per employee per day) —
this is the key index for both the monthly summary query and the per-employee detail query.

`shortfallMinutes` and `overtimeMinutes` are computed at "Recompute" time from
`workedMinutes` vs `Company.attendanceRules.requiredHoursPerDay`, and never both non-zero for the
same day (worked < required → shortfall; worked > required → overtime).

---

## LeaveRequest
```
LeaveRequest {
  employee: ObjectId -> Employee, required
  type: String, enum ["annual", "sick_full_pay", "permission_hours", "unpaid"], required
  from: Date, required
  to: Date, required
  unit: String, enum ["days", "hours"], required   // "permission_hours" uses hours
  amount: Number, required            // number of days or hours, matches `unit`
  reason: String
  status: String, enum ["pending", "approved", "rejected"], default "pending"
  requestedBy: ObjectId -> User, required   // the supervisor who logged it
  decidedBy: ObjectId -> User              // the owner who approved/rejected
  decidedAt: Date
}
```
Indexes: `{ employee: 1, from: -1 }`, `{ status: 1 }`.

---

## JobOrder
```
JobOrder {
  jobOrderNo: Number, required, unique     // from Company.counters.jobOrderNext
  date: Date, required
  customer: ObjectId -> Customer, required
  createdBy: ObjectId -> User, required

  jobNature: String, required              // e.g. "Roll-up Banner"
  actualSize: String                       // "85x200 cm"
  printingSize: String                     // "Digital" / "50x70" / "100x70"
  numberOfCopies: Number, default 1
  inkColour: String
  printingQty: Number
  qtyRequired: Number, required
  kindOfPaper: String
  paperSize: String

  options: {                               // the checkbox grid on the print slip
    lamination: Boolean, default false
    rope: Boolean, default false
    oneSide: Boolean, default false
    twoSide: Boolean, default false
    digital: Boolean, default false
    size50x70: Boolean, default false
    size100x70: Boolean, default false
  }

  copies: {                                // 1st..6th copy free-text lines
    c1: String, c2: String, c3: String, c4: String, c5: String, c6: String
  }

  numberingFrom: String
  perforating: String
  gumming: String
  stitching: String
  coverNo: String
  coverColour: String
  goldStamping: String
  embossing: String
  silkScreen: String
  uv: String
  dieCut: String
  creasing: String
  remarks: String

  materials: [
    { name: String, qty: Number, unit: String }   // e.g. "Art card 350g 70x100", 1, "ream"
  ]

  status: String, enum ["new", "in_press", "done"], default "new"
  invoice: ObjectId -> Invoice            // set once an invoice is created from this JO
}
```
Indexes: `{ jobOrderNo: 1 }` unique, `{ status: 1, date: -1 }` (Job Orders list default view),
`{ customer: 1 }`.

**Activity log** (for the "Activity" panel on the detail screen) is a separate lightweight
collection rather than an embedded array, so it can be reused across entity types:
```
ActivityLog {
  entityType: String, enum ["job_order", "leave_request", ...]
  entityId: ObjectId
  action: String            // "created", "status_changed", "invoice_created", ...
  by: ObjectId -> User
  at: Date, default now
  meta: Object              // free-form, e.g. { from: "new", to: "in_press" }
}
```
Index: `{ entityType: 1, entityId: 1, at: -1 }`.

**Change requests** (the "Change requests" panel — edit requests raised by a supervisor for an
Owner to approve) — separate collection so it's reusable:
```
ChangeRequest {
  entityType: String, enum ["job_order"]
  entityId: ObjectId
  requestedBy: ObjectId -> User
  changes: Object            // proposed field diffs
  status: String, enum ["pending", "approved", "rejected"], default "pending"
  decidedBy: ObjectId -> User
  decidedAt: Date
}
```
Index: `{ entityType: 1, entityId: 1, status: 1 }`.

---

## Invoice
```
Invoice {
  invoiceNo: Number, required, unique
  date: Date, required
  dueDate: Date, required          // date + Company.invoiceDueDays
  customer: ObjectId -> Customer, required
  jobOrder: ObjectId -> JobOrder, required

  total: Number, required          // KWD, 3 decimals
  paid: Number, default 0
  balance: Number, required        // total - paid, kept in sync on every payment write

  status: String, enum ["unpaid", "partial", "paid", "overdue"], default "unpaid"
  // "overdue" is a derived display status (unpaid/partial AND dueDate < today) —
  // store the base status ["unpaid","partial","paid"] and compute "overdue" at read time,
  // OR store it and refresh via a daily cron; prefer computing at read time for correctness.

  payments: [
    { amount: Number, date: Date, method: String, note: String }
  ]
}
```
Indexes: `{ invoiceNo: 1 }` unique, `{ status: 1, dueDate: 1 }`, `{ customer: 1 }`.

---

## PayrollRun
```
PayrollRun {
  month: Number, required     // 1-12
  year: Number, required
  status: String, enum ["draft", "approved", "paid"], default "draft"
  totalNet: Number, required
  lines: [
    {
      employee: ObjectId -> Employee,
      basicSalary: Number,
      dailyRate: Number,
      hourlyRate: Number,
      daysPresent: Number,
      overtimePay: Number,
      deductions: Number,       // e.g. unpaid leave, shortfall
      netPay: Number
    }
  ]
  computedAt: Date
  approvedBy: ObjectId -> User
  approvedAt: Date
}
```
Indexes: `{ year: 1, month: 1 }` unique compound.

---

## Relationships summary
- `JobOrder.customer -> Customer`
- `JobOrder.invoice -> Invoice` (1:1, optional until invoice created)
- `Invoice.jobOrder -> JobOrder`, `Invoice.customer -> Customer`
- `AttendanceRecord.employee -> Employee`
- `LeaveRequest.employee -> Employee`
- `PayrollRun.lines[].employee -> Employee`

## Aggregations needed for the Dashboard (single endpoint `GET /dashboard`)
Compute in one pipeline pass per collection, run in parallel (`Promise.all`):
- Attendance: today's present/absent/late counts across all active employees.
- LeaveRequest: pending count grouped by type.
- JobOrder: counts by status, "new in last 30 days" vs "done in last 30 days".
- Invoice: sum outstanding (`balance` where status != paid), sum overdue (`balance` where overdue),
  sum billed this month (`total` where `date` in current month), sum collected this month
  (`sum of payments[].amount` where payment date in current month).
- PayrollRun: latest month's totalNet + status.
