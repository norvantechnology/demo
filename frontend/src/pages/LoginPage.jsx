import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, ClipboardList, FileText, Wallet } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandMark, Button, Input, SoftLink } from '../components/ui';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../lib/api';

const HIGHLIGHTS = [
  { icon: ClipboardList, label: 'Job orders' },
  { icon: FileText, label: 'Invoices' },
  { icon: Wallet, label: 'Payroll' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@a2z.kw');
  const [password, setPassword] = useState('password123');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (err) {
      const msg = t('login.invalid');
      setErrors({ form: msg });
      toast.error(msg);
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page relative flex min-h-full flex-col lg:flex-row">
      {/* Brand plane — full-bleed on mobile top, half-screen on desktop */}
      <aside className="login-brand relative flex shrink-0 flex-col justify-between overflow-hidden px-5 pb-8 pt-6 text-white sm:px-8 sm:pb-10 sm:pt-8 lg:w-[46%] lg:min-h-full lg:px-10 lg:pb-10 lg:pt-10 xl:w-[48%]">
        <div aria-hidden className="login-brand-glow pointer-events-none absolute inset-0" />
        <div aria-hidden className="login-orb login-orb-a" />
        <div aria-hidden className="login-orb login-orb-b" />
        <div aria-hidden className="login-orb login-orb-c" />
        <div aria-hidden className="login-grain pointer-events-none absolute inset-0 opacity-[0.07]" />

        <div className="login-stagger relative z-[1]" style={{ '--i': 0 }}>
          <div className="flex items-center gap-3">
            <BrandMark size="md" className="login-mark-pulse ring-1 ring-white/15" />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold tracking-wide text-white/55">{t('platform')}</div>
            </div>
          </div>
        </div>

        <div className="relative z-[1] mt-10 max-w-lg space-y-5 lg:mt-0 lg:pb-4">
          <h1
            className="login-stagger text-[2.15rem] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[2.55rem] lg:text-[2.85rem]"
            style={{ '--i': 1 }}
          >
            {t('appName')}
          </h1>
          <p
            className="login-stagger max-w-sm text-[14.5px] font-medium leading-relaxed text-white/60 sm:text-[15px]"
            style={{ '--i': 2 }}
          >
            Follow work on the press floor, keep collections current, and pay the team from attendance.
          </p>
          <ul
            className="login-stagger flex flex-wrap gap-2 pt-1"
            style={{ '--i': 3 }}
            aria-label="Workspace areas"
          >
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/80 backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-white/55" strokeWidth={2} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="login-stagger relative z-[1] mt-8 hidden text-[12px] font-medium tracking-wide text-white/35 lg:mt-0 lg:block"
          style={{ '--i': 4 }}
        >
          {t('domain')}
        </div>
      </aside>

      {/* Form column */}
      <main className="login-form-pane relative flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:items-center sm:px-8 sm:py-10 lg:py-12">
        <div aria-hidden className="login-form-wash pointer-events-none absolute inset-0 lg:opacity-100" />

        <div className="relative w-full max-w-[400px]">
          <div className="login-stagger mb-6 text-center sm:mb-7" style={{ '--i': 2 }}>
            <h2 className="text-[1.5rem] font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-[1.65rem]">
              Sign in
            </h2>
            <p className="mt-1.5 text-[13px] font-medium text-[var(--color-text-muted)]">
              Enter your shop credentials to continue
            </p>
          </div>

          <div
            className="login-card login-stagger rounded-[1.25rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(26,18,20,0.35)] sm:p-7"
            style={{ '--i': 3 }}
          >
            {errors.form ? (
              <div
                role="alert"
                className="mb-4 animate-[fadeUp_0.3s_ease] rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
              >
                {errors.form}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="login-field" style={{ '--i': 0 }}>
                <Input
                  label={t('login.email')}
                  type="email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((x) => ({ ...x, email: undefined, form: undefined }));
                  }}
                  autoComplete="username"
                  error={errors.email}
                  required
                />
              </div>

              <div className="login-field relative" style={{ '--i': 1 }}>
                <Input
                  label={t('login.password')}
                  type={show ? 'text' : 'password'}
                  icon={Lock}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((x) => ({ ...x, password: undefined, form: undefined }));
                  }}
                  autoComplete="current-password"
                  error={errors.password}
                  required
                  className="[&_input]:!pe-11"
                />
                <button
                  type="button"
                  className="absolute end-1.5 top-[34px] flex min-h-10 min-w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] active:scale-95"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div
                className="login-field flex items-center justify-between gap-3 pt-0.5"
                style={{ '--i': 2 }}
              >
                <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--color-text-muted)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-[var(--color-accent)]"
                  />
                  {t('login.remember')}
                </label>
                <SoftLink className="text-[13px] font-semibold transition hover:opacity-80">
                  {t('login.forgot')}
                </SoftLink>
              </div>

              <div className="login-field pt-1" style={{ '--i': 3 }}>
                <Button type="submit" className="login-submit w-full" loading={loading}>
                  {t('common.signIn')}
                </Button>
              </div>
            </form>
          </div>

          <p
            className="login-stagger mt-6 text-center text-[12px] font-medium text-[var(--color-text-muted)] lg:hidden"
            style={{ '--i': 5 }}
          >
            {t('domain')}
          </p>
        </div>
      </main>
    </div>
  );
}
