# UI Screens Spec

Every screen below: layout, every button/action, every filter, every table column, every
modal's fields, empty/loading states. Follow the design system in `01-PROJECT-OVERVIEW.md`.
All screens sit inside the shared shell: sidebar (Dashboard, Job Orders, Invoices, Customers,
Employees, Attendance, Leaves, Payroll, Settings) + top bar (hamburger, language switch,
user name/role, account icon, logout icon).

---

## 0. Login
- Centered card, max-width ~380px, on the `--color-bg` background.
- Fields: Email, Password (with show/hide toggle), "Remember me" checkbox.
- Primary button: "Sign in" (full width, loading spinner while submitting).
- Inline error banner above the form on bad credentials: "Invalid email or password."
- No "forgot password" flow needed for demo (omit or make it a disabled/greyed link).
- On success → redirect to `/dashboard`.

---

## 1. Dashboard (`/dashboard`)
Header: "Dashboard" title, subtitle line: `{user name} ({role}) · {today's date}`.

**Stat cards, row 1 (4 across → 2 → 1):**
1. Present Today — big number `present/totalActive`, sub-line "Late: N · On leave: N"
2. Absent — big number, red if > 0 else default
3. Pending approvals — big number (amber), sub-line "Leave requests: N · Change requests: N"
4. In press — big number, sub-line "New: N · Done (30d): N"

**Stat cards, row 2:**
5. Outstanding (amber number) — sub-line "Open invoices: N" — clicking navigates to `/invoices`
6. Overdue (red number) — clicking navigates to `/invoices?status=overdue`
7. Billed this month (default/dark number)
8. Collected this month (green number)

**Two-column panel:**
- Left: "Recent job orders" card, header row with "All" link → `/job-orders`. List of latest 8:
  JO No. (link), customer name + company (muted line below), date, status pill.
- Right: "Unpaid invoices" card, header row with "All" link → `/invoices?status=unpaid`. List of
  latest 8, sorted by due date ascending: row number, customer name + company, due date (red text
  if overdue) + "Overdue" pill when applicable, amount, invoice no. link on the left.

**Bottom strip:** "Payroll" mini-card — period label (e.g. "August 2026"), status pill
(Approved/Paid), total net amount, "Payroll" button linking to `/payroll`.

All numbers are live from `GET /dashboard`. Loading state: skeleton cards (gray pulsing blocks),
not spinners, so layout doesn't jump.

---

## 2. Job Orders — list (`/job-orders`)
Header row: "Job Orders" title (left), search input (right, placeholder "Search"), status filter
tabs (All / New / In press / Done — segmented control, black pill on active), primary button
"New job order" (top-right, opens Add modal / navigates to `/job-orders/new`).

**Table columns:** JO No. (link, bold), Date, Customer (name + company/muted subline), Job Nature,
Qty Required (right-aligned), Status (pill), Invoice (link to invoice no. if one exists, else
blank), row action "Print" (secondary small button, opens print view in new tab).
A small numeric badge next to a JO No. (e.g. "1") indicates unread/pending change requests on
that job order.

Mobile: horizontal-scroll table (per design system rule), JO No. + Status pinned as the
non-scrolling first/last visual anchor if feasible, else a simple scrollable table is acceptable
for the demo.

Empty state: "No job orders yet" + "New job order" button.

### New / Edit Job Order (full page, not modal — form is long)
Route: `/job-orders/new` and `/job-orders/:id/edit`. Sections, each a card:

**Customer & Job**
- Customer (searchable select, shows name + company; includes "Cash Customer"; "+ Add new
  customer" inline option that opens the Customer Add modal without leaving the page)
- Job nature (text, required, e.g. "Roll-up Banner")
- Date (date picker, defaults to today)

**Specs**
- Actual size (text, e.g. "85x200 cm")
- Printing size (select: Digital / 50x70 / 100x70)
- No. of copies (number)
- Ink colour (text, e.g. "Full colour")
- Printing qty (number)
- Qty required (number, required)
- Kind of paper (text)
- Paper size (text)

**Finishing options** (checkbox grid, matches print slip layout): Lamination, Rope, One side,
Two side, Digital, 50×70, 100×70.

**Copy tracking** (6 small text inputs): 1st Copy … 6th Copy.

**Additional finishing** (text inputs in a grid): Numbering from, Perforating, Gumming,
Stitching, Cover No., Cover colour, Gold stamping, Embossing, Silk screen, UV, Die cut, Creasing.

**Materials** (repeatable row list): Name (text), Qty (number), Unit (select: ream/set/roll/sheet/
pcs/kg). "+ Add material" link button. Trash icon to remove a row.

**Remarks** (textarea, full width).

Footer (sticky on mobile): "Cancel" (secondary) + "Save job order" (primary). On create, redirect
to the new job order's detail page.

### Job Order — detail (`/job-orders/:id`)
Header: "Job order {no.}" title, subtitle `{date} · {createdBy name} ({role})`. Right-aligned
buttons: Back, Print, Edit, Create invoice (primary, black — disabled/hidden if an invoice already
exists, in which case show "View invoice" instead linking to it).

Status row: pill showing current status, plus a 3-way segmented toggle (New / In press / Done) —
owner and supervisor can click to change status; clicking logs an activity entry.

**Two-column layout (desktop), stacked (mobile):**
- Left (main): two-column key:value grid of every field entered in the form above (Customer,
  Company, Tel, Job nature, Actual size, Printing size, No. of copies, Ink colour, Printing qty,
  Qty required, Kind of paper, Paper size, Copies, Numbering from, Perforating, Gumming,
  Stitching, Cover No., Cover colour, Lamination [shows selected finishing options joined by
  comma, e.g. "Digital, One side"], Gold stamping, Remarks). Empty fields render as an em dash "—".
  Below that: "MATERIALS" section header + list of `name — qty unit` rows.
- Right (sidebar): "Change requests" card (list of pending change requests with Approve/Reject
  for owners, or "No records" empty state) and "Activity" card (chronological log:
  "Job order {no} created" · timestamp · by whom; "Status changed to In press" · timestamp · by
  whom; etc).

### Job Order — print view (`/job-orders/:id/print`, opened in new tab, no sidebar/topbar)
Plain white page styled for printing, bilingual (English left-aligned label, Arabic right-aligned
label on the same line for every field).
- Top-left toolbar (screen-only, hidden on actual print via `@media print`): "← Back" button.
- Top-right toolbar (screen-only): "Print / Save PDF" button (triggers `window.print()`).
- Header: company Arabic name (centered, top), company name + address/phone (left), boxed
  "No. {jobOrderNo}" + date (right).
- "Job Details / تفاصيل العمل" section divider.
- Two-column field grid exactly mirroring the detail page's core fields, each with EN label,
  value, AR label.
- Finishing options as a row of bordered boxes (Lamination, Rope, One side, Two side, Digital,
  50×70, 100×70), each with a checkmark if selected.
- Two-column: left = Copy tracking (1st–6th Copy, EN/AR), right = Numbering/Perforating/Gumming/
  Stitching/Cover No./Cover colour (EN/AR).
- Two-column: left = Remarks box + Materials list below it, right = finishing add-ons as small
  bordered boxes (Gold stamping, Embossing, Silk screen, UV, Die cut, Creasing) + "Incharge /
  مسؤول" and "Manager / المدير" signature lines.
- Bottom: "Receiver's Sign. / توقيع المستلم" and "Sales Signature / توقيع المبيعات" signature
  lines.
- Print CSS: hide toolbar, set page margins, force `color-adjust: exact` so pill/box borders
  print correctly, single page target for a typical job order (materials list can overflow to a
  second page if long).

---

## 3. Invoices (`/invoices`)
Header: "Invoices" title, primary button "Create invoice" (top-right — opens a modal to pick an
un-invoiced Job Order, or navigate there from the Job Order detail page instead; keep both entry
points).

**Stat cards row (4 across):** Total, Paid (green), Outstanding (amber), Overdue (red).

**"Who paid and who has not" card:**
- Filter tabs: All / Open / Unpaid / Partial / Overdue / Paid (segmented control).
- Table columns: Invoice No. (link), Date, Due date (red text if overdue), Customer (name +
  company subline), JO No. (link), Total, Paid (green if >0), Balance, Status (pill).
- Empty state per filter: "No {filter} invoices."

### Create Invoice modal
- Job Order (searchable select, filtered to job orders without an invoice yet — shows JO No. +
  customer + job nature)
- Total (number, KWD, pre-filled blank — press quotes a manual total; not auto-derived from
  materials in this demo)
- Due date (date, defaults to today + `invoiceDueDays` from settings)
- Cancel / "Create invoice" (primary)

### Invoice detail (`/invoices/:id`)
- Header: Invoice No., customer, linked JO No., status pill, Balance prominently.
- "Record payment" button (primary) → modal: Amount, Date, Method (select: Cash/Bank
  transfer/Card/Cheque), Note. Updates paid/balance/status live.
- Payments history table below: Date, Amount, Method, Note.
- "Edit due date" (secondary, small).

---

## 4. Customers (`/customers`)
Header: "Customers" title, search input (top-right), primary button "Add" (top-right).

**Table columns:** Name (bold), Company, Phone, Job Orders (count, underlined link → filters
Job Orders list to that customer), Outstanding (amber if >0 else plain "0.000 KWD"), row action
"Edit" (secondary text button, opens Edit modal).

Mobile: collapse to stacked cards — Name + Company on top line, Phone/Job Orders/Outstanding as
labeled rows below, Edit as a small icon button top-right of the card.

### Add / Edit Customer modal
Fields: Name (required), Company, Phone, Email, Address (single line), Note (textarea).
Footer: Cancel / Save. Edit modal pre-fills existing values; title changes to "Edit".
Deleting a customer: not exposed in UI for the demo (keep scope tight) unless explicitly asked.

---

## 5. Employees (`/employees`)
Header: "Employees" title, subtitle "N active", search input, "All" checkbox filter (toggles
showing inactive employees too), primary button "Add employee".

**Table columns:** # (employee no., e.g. "0001"), Name (bold, with Arabic name in muted script
below it), Job title, Phone, Device ID, Hire date, Basic salary (KWD), Status (pill:
Active=green, Inactive=gray), row action "Edit".

### Add Employee modal
Fields: Name (required), Arabic name, Job title, Phone, Device ID (helper text: "User ID on the
fingerprint terminal"), Civil ID, Hire date (date, required), Basic salary KWD (number, required,
default 250 for demo convenience), Status (select: Active/Inactive, default Active), Note
(textarea). Footer: Cancel / Save.

### Edit Employee modal
Same fields plus a read-only "Employee No." field (e.g. "0001", not editable) shown next to
Status. Everything else identical to Add.

---

## 6. Attendance (`/attendance`)
Header: "Attendance" title, month select + year select (top-right), "Recompute" button
(secondary — re-runs the calculation for the selected month against current attendance rules;
shows a brief loading state / toast "Recomputed").

**Two-panel layout:**
- Left "Summary" card: table of all employees for the selected month — Employee (name +
  employee no. subline), Present, Absent (red if >0), Late (amber if >0), Overtime (green,
  `H:MM` format), Shortfall (red, `H:MM` format). Horizontally scrollable if columns overflow on
  smaller screens. Clicking a row loads that employee into the right panel (row highlighted).
- Right detail card: header shows selected employee's name + employee no. Table: Date (with
  weekday abbreviation below it), Status (pill: Present/Absent/Off), Check in, Check out, Worked
  (`H:MM`), Late, Overtime (green), Shortfall (red), row action "Edit".
  - "seed" muted micro-label under Present status rows = data source hint (device-seeded demo
    data) — keep it as a small muted caption under the status pill, non-interactive.

Mobile: stack the two panels vertically (Summary first, collapsed to a simple list you tap to
open the detail panel below it, or push detail to its own sub-route `/attendance/:employeeId`).

### Edit Attendance modal
Title: "Edit · {date}". Fields: Check in (time picker), Check out (time picker), Note (text).
Link/button: "Use device punches" (secondary, resets the two time fields back to the original
device-recorded punch and disables further manual override until edited again). Footer:
Cancel / Save.

---

## 7. Leaves (`/leaves`)
Header: "Leaves" title, subtitle "Leave and permissions are entered by the supervisor and
approved by the administrator." Top-right: segmented control "Leave requests" / "Balances", and
a primary button "New request".

### Leave requests tab
Filter dropdown: All / Pending / Approved / Rejected.
Table columns: Employee (bold, with "Requested by: {name} ({role})" muted subline), Type (plain
text: Annual leave / Sick leave (full pay) / Permission (hours) / Unpaid leave), From, To,
Days/Hours (e.g. "5 days" or "2 hours"), Reason, Status (pill), row actions:
- If Pending: "Approve" (primary black small button), "Reject" (secondary), "Delete" (text, red)
- If Approved/Rejected: just "Delete" (text, red), and Status shows who decided it
  ("Abdullah Al-Sahara (Owner)" muted subline under the pill).

### Balances tab
Table: Employee, Annual leave entitlement (days/year, from payroll rules), Taken, Remaining.

### New Request modal
Fields: Employee (searchable select, required), Type (select: Annual leave / Sick leave (full
pay) / Permission (hours) / Unpaid leave), From (date), To (date — hidden/disabled and replaced
by nothing extra when Type = Permission (hours), since permissions are same-day; instead show an
"Hours" number field), Reason (text). Footer: Cancel / Save.
Validation: To ≥ From; for Permission type, only From + Hours needed.

---

## 8. Payroll (`/payroll`)
Header: "Payroll" title, subtitle "Payroll is prepared 3 days before the month ends." (value
pulled live from settings), primary button "Create payroll" (top-right).

**Table columns:** Period (e.g. "August 2026", link → detail), From (date range start), Total net
(KWD), Status (pill: Draft=gray, Approved=green, Paid=green/darker), row action "Edit".

### Create Payroll modal
Fields: Period — two selects side by side (Month, Year). Helper text: "Computed from attendance
and approved leave. Can be recomputed while it is a draft." Footer: Cancel / "Create payroll"
(primary).

### Payroll run detail (`/payroll/:id`)
Header: period title, status pill, total net. Buttons: "Approve" (primary, if draft, owner only),
"Mark as paid" (primary, if approved, owner only), "Recompute" (secondary, only while draft).
Table of per-employee lines: Employee, Basic salary, Days present, Overtime pay, Deductions,
Net pay.

---

## 9. Settings (`/settings`) — **owner only** (supervisors get redirected away / nav item hidden)
Header: "Settings" title. Sub-navigation as a segmented tab row: Company details / Attendance
rules / Payroll rules / Holidays / Devices.

### 9.1 Company details
Two-column form:
- Name (required), Arabic name
- Address (full width)
- Phone, Email
- Logo: preview box ("No logo" placeholder if unset) + "Upload logo" button, helper text
  "PNG, JPG, WEBP or SVG up to 2 MB. Shown on the login page, sidebar and printed sheets."
- Brand colour: color swatch + hex text input, Invoice footer (EN)
- Invoice footer (AR), Invoice Due date (days, number)
- Three side-by-side number inputs: JO No. next, Invoice No. next, Employee No. next (editable —
  lets the demo operator bump starting numbers)
- "Save" (primary, bottom-right)

### 9.2 Attendance rules
- Shift start (time), Shift end (time)
- Required hours per day (number), Grace minutes (number)
- Minimum session (minutes) — helper text: "A punch pair shorter than this is treated as a badge
  retry, not a departure."
- Weekend: two rows of day checkboxes (Sunday–Saturday)
- Helper text: "After changing rules use 'Recompute' on the Attendance page to refresh the
  month."
- "Save" (primary)

### 9.3 Payroll rules
- Days per month for the daily rate (number) — helper: "basic ÷ this = daily rate; daily ÷
  required hours = hourly rate"
- Annual leaves (days / year)
- Overtime × work day, Overtime × weekend, Overtime × holiday (all numbers/multipliers)
- Prepare payroll (days before month end)
- Helper text: "Kuwait Labour Law defaults: 125% on work days, 150% on the weekly rest day, 200%
  on public holidays."
- "Save" (primary)

### 9.4 Holidays
- Table: Name, Date, Recurring (yes/no), row action "Delete".
- "Add holiday" button (top-right) → small modal: Name, Date, Recurring (checkbox). Cancel / Save.
- Empty state: "No holidays added yet."

### 9.5 Devices
- Card "ZKTeco terminals" with "Add" button (top-right of the card).
- Helper text: "Punches are pulled from each terminal every 30 minutes over the customer's
  public IP (port 4370)."
- Table: Name, IP : Port, Last sync (timestamp or "—" + red note e.g. "Demo: no live device
  connected yet"), Status (pill: Active=green / Inactive=gray), row actions "Sync now"
  (secondary button) and "Edit" (text link).
- Add/Edit modal: Name, IP, Port (default 4370). Cancel / Save.

---

## 10. Shared components checklist for Cursor
- `<StatCard label value sublabel tone />`
- `<StatusPill status map />` — map covers job order status, invoice status, leave status,
  attendance status, payroll status, active/inactive, in one shared component with a status→
  color lookup table.
- `<SegmentedTabs options value onChange />`
- `<DataTable columns rows loading empty ... />` with built-in mobile card-collapse mode toggle.
- `<Modal / BottomSheet>` — same component, switches presentation by viewport width.
- `<SearchableSelect />` for Customer/Employee/JobOrder pickers.
- `<CurrencyKwd value />` — formats to 3 decimals + "KWD" suffix.
- `<EmptyState icon title action />`
- Language/RTL: wrap the app in an `I18nextProvider`; a `<LangSwitch />` in the top bar toggles
  `i18n.language` and sets `document.documentElement.dir`.

## 11. States to implement on every list/detail screen
- Loading: skeleton rows/cards (not spinners) matching the final layout's shape.
- Empty: icon + message + relevant primary action.
- Error: inline retry banner ("Something went wrong. Retry.") — never a blank white screen.
- Optimistic updates for: status toggles, leave approve/reject, invoice payments — update the UI
  immediately, roll back with a toast on failure.
