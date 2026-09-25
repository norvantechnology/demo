import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  UserRound,
  CalendarCheck,
  Palmtree,
  Wallet,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandMark } from '../components/ui';

const NAV = [
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/job-orders', key: 'jobOrders', icon: ClipboardList },
  { to: '/invoices', key: 'invoices', icon: FileText },
  { to: '/customers', key: 'customers', icon: Users },
  { to: '/employees', key: 'employees', icon: UserRound },
  { to: '/attendance', key: 'attendance', icon: CalendarCheck },
  { to: '/leaves', key: 'leaves', icon: Palmtree },
  { to: '/payroll', key: 'payroll', icon: Wallet },
  { to: '/settings', key: 'settings', icon: Settings, ownerOnly: true },
];

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function LangSwitch() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center rounded-lg px-2.5 text-[12.5px] font-semibold tracking-tight text-[#475467] transition hover:bg-[#f4f3f1] hover:text-[var(--color-text-primary)]"
      onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
    >
      {isAr ? 'EN' : 'العربية'}
    </button>
  );
}

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const initials = initialsFromName(user?.name);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    function place() {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onDoc(e) {
      const t = e.target;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    // Defer so the opening click does not immediately close the menu
    const timer = window.setTimeout(() => {
      document.addEventListener('click', onDoc);
      document.addEventListener('keydown', onKey);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="profile-menu" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`profile-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="profile-avatar" aria-hidden>
          {initials}
        </span>
        <span className="profile-meta">
          <span className="profile-name">{user?.name || 'User'}</span>
          <span className="profile-role">{user?.role || '—'}</span>
        </span>
        <ChevronDown
          className={`profile-caret h-3.5 w-3.5 shrink-0 text-[#98a2b3] transition ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              className="profile-dropdown"
              aria-label="Account menu"
              style={{ top: coords.top, right: coords.right }}
            >
              <div className="profile-dropdown-head">
                <span className="profile-avatar profile-avatar-lg" aria-hidden>
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-[#101012]">{user?.name}</div>
                  <div className="mt-0.5 truncate text-[12px] font-medium capitalize text-[#667085]">
                    {user?.role}
                  </div>
                  {user?.email ? (
                    <div className="mt-0.5 truncate text-[11.5px] font-medium text-[#98a2b3]">
                      {user.email}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="profile-dropdown-divider" />
              <button
                type="button"
                role="menuitem"
                className="profile-logout"
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpen(false);
                  await onLogout();
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                <span>Log out</span>
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function Sidebar({ open, onClose }) {
  const { t } = useTranslation();
  const { isOwner } = useAuth();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const content = (
    <div className="flex h-full w-[min(268px,86vw)] flex-col bg-[var(--color-sidebar)] text-white lg:w-[240px]">
      <div className="border-b border-white/[0.08] px-4 pb-4 pt-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
          {t('platform')}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <BrandMark size="md" />
          <div className="min-w-0">
            <div className="truncate text-[14px] font-bold leading-tight tracking-tight text-white">
              {t('appName')}
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-white/40">Print, Invoice, HR</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {NAV.filter((n) => !n.ownerOnly || isOwner).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-semibold tracking-tight transition ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white shadow-sm shadow-black/20'
                    : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={1.7} />
              <span className="truncate">{t(`nav.${item.key}`)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:start-0 lg:z-30 lg:block">{content}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/45"
            onClick={onClose}
          />
          <div className="absolute inset-y-0 start-0 shadow-2xl">
            <button
              type="button"
              aria-label="Close"
              className="absolute end-2 top-3 z-10 rounded-lg bg-white/10 p-2 text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-full bg-[var(--color-bg)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:ps-[240px]">
        <header className="app-topbar sticky top-0 z-20">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#344054] hover:bg-[#f4f3f1] lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <LangSwitch />
            <div className="hidden h-5 w-px shrink-0 bg-[#e8e6e3] sm:block" aria-hidden />
            <ProfileMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <main className="page px-3 py-4 pb-10 sm:px-6 sm:py-5 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
