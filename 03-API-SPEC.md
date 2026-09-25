# API Spec

Base URL: `/api`. All responses JSON. All list endpoints: `?page=1&limit=20&search=&sort=field:asc`.
Auth: `Authorization: Bearer <accessToken>`, except `/auth/*`.
Roles: `owner`, `supervisor` — endpoints marked **[owner only]** return 403 for supervisors.

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | returns `{ accessToken, user }`, sets refresh cookie |
| POST | `/auth/refresh` | — (cookie) | returns new `accessToken` |
| POST | `/auth/logout` | — | clears refresh cookie |
| GET | `/auth/me` | — | returns current user |

## Dashboard
| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard` | Single aggregated payload: `{ presentToday, absentToday, lateToday, onLeaveToday, pendingApprovals: { leaveRequests, changeRequests }, inPress: { new, done30d }, outstanding, overdue, billedThisMonth, collectedThisMonth, recentJobOrders: [...5], unpaidInvoices: [...top 10 by due date], latestPayroll }` |

## Customers
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/customers` | — | `?search=` matches name/company/phone. Response rows include computed `jobOrderCount`, `outstanding`. |
| POST | `/customers` | `{ name, company, phone, email, address, note }` | `name` required |
| GET | `/customers/:id` | — | |
| PATCH | `/customers/:id` | any subset of above | |
| DELETE | `/customers/:id` | — | **[owner only]** block if `jobOrderCount > 0` (return 409 with message) |
| GET | `/customers/:id/job-orders` | — | list of that customer's job orders |

## Employees
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/employees` | — | `?status=active|inactive|all&search=` |
| POST | `/employees` | `{ name, arabicName, jobTitle, phone, deviceId, civilId, hireDate, basicSalaryKwd, status, note }` | server assigns `employeeNo` from counter |
| GET | `/employees/:id` | — | |
| PATCH | `/employees/:id` | any subset | employeeNo is never editable |
| DELETE | `/employees/:id` | — | **[owner only]** soft-delete: set `status: "inactive"` rather than hard delete if attendance/payroll history exists |

## Attendance
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/attendance/summary` | — | `?month=9&year=2026` → per-employee aggregate: `{ employeeId, name, employeeNo, present, absent, late, overtimeMinutes, shortfallMinutes }[]` |
| GET | `/attendance/employee/:employeeId` | — | `?month=&year=` → full day-by-day list for the right-hand detail panel |
| PATCH | `/attendance/:recordId` | `{ checkIn, checkOut, note }` | manual edit, sets `source: "manual"`, recomputes worked/late/overtime/shortfall for that record |
| POST | `/attendance/:recordId/use-device-punches` | — | reverts a manually-edited record back to the original device punch times |
| POST | `/attendance/recompute` | `{ month, year }` | recalculates all records for the month against current `attendanceRules` (used after rule changes or new device syncs) |

## Leaves
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/leaves` | — | `?status=all|pending|approved|rejected` |
| POST | `/leaves` | `{ employeeId, type, from, to, unit, amount, reason }` | `requestedBy` = current user |
| PATCH | `/leaves/:id/approve` | — | **[owner only]** |
| PATCH | `/leaves/:id/reject` | — | **[owner only]** |
| DELETE | `/leaves/:id` | — | |
| GET | `/leaves/balances` | — | `?year=` → per-employee remaining annual leave days (`payrollRules.annualLeaveDaysPerYear` minus approved annual leave taken) |

## Job Orders
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/job-orders` | — | `?status=all|new|in_press|done&search=` (search matches JO No., customer name, job nature) |
| POST | `/job-orders` | full JobOrder fields (see schema) minus `jobOrderNo` | server assigns `jobOrderNo` from counter, `status: "new"` |
| GET | `/job-orders/:id` | — | includes populated `customer`, `activity` (last 20), `changeRequests` (pending) |
| PATCH | `/job-orders/:id` | any subset | logs an `ActivityLog` entry per meaningful change |
| PATCH | `/job-orders/:id/status` | `{ status }` | shortcut used by the New/In press/Done toggle buttons; logs activity |
| DELETE | `/job-orders/:id` | — | **[owner only]**, blocked if an invoice already exists (409) |
| GET | `/job-orders/:id/print` | — | returns the full printable payload (job order + company header info) for the print view |
| POST | `/job-orders/:id/change-requests` | `{ changes }` | supervisor proposes an edit |
| PATCH | `/change-requests/:id/approve` | — | **[owner only]**, applies the diff to the JobOrder |
| PATCH | `/change-requests/:id/reject` | — | **[owner only]** |

## Invoices
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/invoices` | — | `?status=all|open|unpaid|partial|overdue|paid&search=`. Also returns header totals: `{ total, paid, outstanding, overdue }` for the stat cards, computed in the same request (avoid a second round trip). |
| POST | `/invoices` | `{ jobOrderId, total, dueDate }` | pulls `customer` from the job order; sets `jobOrder.invoice` back-reference |
| GET | `/invoices/:id` | — | |
| POST | `/invoices/:id/payments` | `{ amount, date, method, note }` | updates `paid`, `balance`, `status` |
| PATCH | `/invoices/:id` | `{ dueDate, ... }` | |
| DELETE | `/invoices/:id` | — | **[owner only]**, blocked if any payment recorded |

## Payroll
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/payroll` | — | list of `PayrollRun`s, newest first |
| POST | `/payroll` | `{ month, year }` | **[owner only]** — computes lines from attendance + approved leave + `payrollRules`, creates a `draft` run; if a run for that period exists, this recomputes it (only while status is `draft`) |
| GET | `/payroll/:id` | — | full run with per-employee lines |
| PATCH | `/payroll/:id/approve` | — | **[owner only]**, `draft -> approved` |
| PATCH | `/payroll/:id/pay` | — | **[owner only]**, `approved -> paid` |

## Settings **[owner only for all writes]**
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/settings/company` | — | |
| PATCH | `/settings/company` | company fields incl. counters (next numbers editable) | |
| POST | `/settings/company/logo` | multipart file | returns `logoUrl` |
| GET | `/settings/attendance-rules` | — | |
| PATCH | `/settings/attendance-rules` | rule fields | |
| GET | `/settings/payroll-rules` | — | |
| PATCH | `/settings/payroll-rules` | rule fields | |
| GET | `/settings/holidays` | — | |
| POST | `/settings/holidays` | `{ name, date, recurring }` | |
| DELETE | `/settings/holidays/:id` | — | |
| GET | `/settings/devices` | — | |
| POST | `/settings/devices` | `{ name, ip, port }` | |
| PATCH | `/settings/devices/:id` | `{ name, ip, port }` | |
| POST | `/settings/devices/:id/sync-now` | — | triggers a pull; in demo mode returns a stub "no live device connected" note |

## Error shape (consistent across all endpoints)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Name is required", "fields": { "name": "required" } } }
```
Standard codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `SERVER_ERROR` (500).

## Performance notes for Cursor
- Every `GET` list route must use `.lean()` and only `.select()` the fields the table actually
  renders — don't return full documents to a list view.
- Use `Promise.all` for the dashboard's parallel aggregations.
- Add the compound indexes from `02-DATABASE-SCHEMA.md` in the Mongoose schema definitions
  directly (`schema.index({...})`), not as an afterthought.
- Paginate every list; default `limit=20`, hard max `100`.
