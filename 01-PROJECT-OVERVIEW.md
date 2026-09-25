# Sahara Printing Press — Demo App Overview

## 1. What this is
A job-order / invoicing / HR management web app for a printing press business
("Sahara Printing Press"). This is a **client demo**, so priorities are:

1. **Fast APIs** (small payloads, indexed queries, no N+1, pagination everywhere lists appear).
2. **Mobile + laptop responsive UI** (usable one-handed on a phone, comfortable on desktop).
3. **Clean, professional, modern UI** — no cartoonish/"funky" icons, no gradients-for-the-sake-of-it,
   restrained color use, generous whitespace, consistent spacing scale.
4. **Optimized, normalized MongoDB schema** (see `02-DATABASE-SCHEMA.md`).

## 2. Tech stack
- **Backend:** Node.js + Express (or Fastify), Mongoose ODM, MongoDB.
- **Auth:** JWT (access token, short-lived) + refresh token (httpOnly cookie).
- **Validation:** Zod or Joi on every request body.
- **Frontend:** React (Vite), React Router, TanStack Query (server state/caching),
  a lightweight component system (no heavy UI kit — build custom components per the
  design system below, optionally on top of Radix primitives for accessibility).
- **Styling:** Tailwind CSS (utility-first, easy to keep consistent + responsive).
- **Charts (dashboard, if added later):** Recharts.
- **Icons:** `lucide-react` only. Outline style, 18–20px, single stroke weight. No emoji, no
  filled/cartoon icon packs.
- **Dates:** dayjs.
- **i18n:** `react-i18next` — English + Arabic, with RTL flip (`dir="rtl"` on `<html>` when Arabic
  is active). All labels pulled from translation files, not hardcoded strings.

## 3. Multi-file structure for this handoff
- `01-PROJECT-OVERVIEW.md` — this file.
- `02-DATABASE-SCHEMA.md` — every MongoDB collection, fields, types, indexes, relationships.
- `03-API-SPEC.md` — every REST endpoint, method, params, body, response shape, auth rules.
- `04-UI-SCREENS-SPEC.md` — every screen, every button, every filter, every modal/field, every
  empty/loading/error state.

Give Cursor all four files together — they cross-reference each other by collection/endpoint name.

## 4. Roles & auth
Two roles for the demo:

| Role | Can do |
|---|---|
| **Owner / Administrator** | Everything: approve/reject leave, edit settings, create payroll, edit anything. |
| **Supervisor** | Create job orders, request leave on behalf of employees, mark attendance edits. Cannot access Settings or Payroll approval. |

- Login screen: email + password, "Sahara Printing Press" branding, error state for bad
  credentials, "Remember me" checkbox. No public sign-up (accounts are seeded/created by an
  Owner from a future "Users" screen — out of scope for this demo, seed 2 users).
- Top bar always shows the logged-in user's **name + role** and a logout icon.
- JWT stored in memory + httpOnly refresh cookie; axios/fetch wrapper auto-refreshes on 401 once,
  then redirects to `/login` on repeated failure.

## 5. Design system

### Layout
- **Sidebar** (fixed, 248px desktop / collapsible drawer on mobile, hamburger icon top-left):
  - Top: small square logo tile (letter avatar if no logo uploaded) + company name (bold) +
    a smaller muted line above it showing the platform/tenant label (e.g. "Kahraman Al Dorwaza (KDR)").
  - Nav items (in order): Dashboard, Job Orders, Invoices, Customers, Employees, Attendance,
    Leaves, Payroll, Settings. Each with a lucide icon + label. Active item: white/light pill
    background on the dark sidebar. Hover: subtle lighten.
  - Footer (bottom of sidebar, small muted text): platform domain, e.g. `kdrcore.com`.
- **Top bar** (white, thin bottom border): hamburger (toggles sidebar on mobile), page breadcrumb
  is implied by page title in content area (not duplicated in top bar). Right side: language
  toggle ("EN / العربية" as a small text switcher, not flags), user name + role (two lines,
  right-aligned), a small user/account icon, a logout icon.
- **Content area**: light gray background (`#f5f5f6`), white cards with `rounded-xl`,
  `shadow-sm`, `border border-gray-200`, consistent `p-4`/`p-6` padding.

### Color palette (CSS variables)
```css
--color-bg: #f5f5f6;
--color-surface: #ffffff;
--color-sidebar: #15100f;          /* near-black, warm */
--color-sidebar-active: rgba(255,255,255,0.08);
--color-accent: #3d1526;           /* deep maroon, used sparingly (top hairline, focus rings) */
--color-text-primary: #111114;
--color-text-muted: #6b7280;
--color-border: #e5e7eb;

--color-success: #16a34a;   /* Paid / Done / Approved / Present */
--color-success-bg: #dcfce7;
--color-warning: #d97706;   /* Pending / In press */
--color-warning-bg: #fef3c7;
--color-danger: #dc2626;    /* Overdue / Unpaid / Absent / Rejected */
--color-danger-bg: #fee2e2;
--color-info: #2563eb;      /* New */
--color-info-bg: #dbeafe;
--color-neutral-bg: #f3f4f6; /* Inactive / Off / Cash customer */
```
Status pills: colored background (light) + colored text (dark shade of same hue), `rounded-full`,
`text-xs font-medium`, `px-2.5 py-0.5`. Never use raw red/green text without the pill background —
keeps the table scannable.

### Typography
- Font: Inter (or system-ui fallback stack).
- Page title: `text-2xl font-semibold`.
- Card/stat labels: `text-sm text-muted`.
- Stat numbers: `text-3xl font-bold`, colored by meaning (red for overdue, green for collected,
  amber for pending, default dark for neutral counts).
- Table header: `text-xs uppercase tracking-wide text-muted font-medium`.
- Table body: `text-sm`.

### Buttons
- Primary: solid black/near-black background, white text, `rounded-lg`, used for the single most
  important action per screen (e.g. "New job order", "Create invoice", "Save").
- Secondary: white background, gray border, dark text — used for "Cancel", "Back", "Print",
  "Edit".
- Destructive text-only: red text, no border — used for "Reject", "Delete" in table rows.
- All buttons: visible focus ring, disabled state at 50% opacity + `cursor-not-allowed`,
  loading state replaces label with a small spinner (never disable without visual feedback).

### Tables
- Sticky header on scroll for long lists.
- Row hover: subtle background tint.
- Numeric columns right-aligned; text columns left-aligned (flip for RTL).
- Every list row that opens a detail view: the primary column (ID/name) is a link (underlined,
  no unnecessary color) — the rest of the row is not clickable to avoid mis-taps on mobile.
- Empty state: centered icon + one-line message + primary action button (e.g. "No customers yet
  — Add your first customer").

### Modals
- Centered, `max-w-lg`, white, `rounded-xl`, header with title + close (X) icon, body, footer with
  right-aligned Cancel (secondary) + primary action button.
- On mobile (<640px): modal becomes a full-height bottom sheet sliding up, with the same
  header/body/footer structure, to keep forms comfortable to fill with a thumb.
- Form fields: label above input, `rounded-lg border`, focus ring in accent color, inline
  validation error text in red below the field.

### Responsiveness rules
- Breakpoint: mobile <640px, tablet 640–1024px, desktop >1024px.
- Sidebar: overlay drawer on mobile/tablet (hidden by default, hamburger opens it, backdrop click
  closes it). Persistent on desktop.
- Stat card rows: 4-across desktop → 2-across tablet → 1-across mobile, horizontally scrollable
  as a fallback only if content genuinely can't stack.
- Tables: on mobile, either (a) horizontal scroll inside a bordered container (preferred for
  data-dense tables like Job Orders/Invoices) or (b) collapse to stacked "card list" rows where
  each row becomes a small card with label:value pairs (preferred for simpler lists like
  Customers). Pick (b) for Customers/Employees, (a) for Job Orders/Invoices/Attendance.
- Touch targets minimum 40px height on mobile for buttons/row actions.

## 6. Currency & locale
- Currency: **KWD**, always shown with **3 decimal places** (e.g. `1,444.234 KWD`).
- Dates displayed as `DD/MM/YYYY`. Store as ISO `Date` in MongoDB, format on the frontend.
- Numbers: thousands separator, locale-aware via `Intl.NumberFormat`.

## 7. Cross-cutting API rules (see 03-API-SPEC.md for detail)
- All list endpoints support `?page=&limit=&search=&sort=` and return
  `{ data: [...], total, page, limit }`.
- All list endpoints are indexed on the fields they filter/sort by (see schema file).
- All mutating endpoints return the updated document so the frontend can update its cache
  optimistically without a refetch.
- Auto-incrementing human-readable numbers (Job Order No., Invoice No., Employee No.) are
  reserved server-side atomically (see Settings/Counters in schema file) — never computed as
  `max(existing) + 1` on the client.
