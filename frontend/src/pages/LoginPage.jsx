import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandMark, Button, Input, SoftLink } from '../components/ui';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../lib/api';

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
    <div className="relative flex min-h-full">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[var(--color-sidebar)] p-10 text-white lg:flex xl:w-[46%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_500px_at_20%_10%,color-mix(in_srgb,var(--color-accent)_55%,transparent),transparent_60%),radial-gradient(500px_400px_at_90%_90%,rgba(255,255,255,0.06),transparent_50%)]"
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <BrandMark size="md" />
            <div>
              <div className="text-[15px] font-bold tracking-tight">{t('appName')}</div>
              <div className="text-[11px] font-medium text-white/45">{t('platform')}</div>
            </div>
          </div>
        </div>
        <div className="relative max-w-md space-y-4 pb-6">
          <h2 className="text-[2rem] font-extrabold leading-tight tracking-tight">
            Jobs, invoices,<br />and payroll.
          </h2>
          <p className="text-[14.5px] font-medium leading-relaxed text-white/55">
            Follow work on the press floor, keep collections current, and pay the team from attendance.
          </p>
        </div>
        <div className="relative text-[12px] font-medium text-white/30">{t('domain')}</div>
      </div>

      {/* Form column */}
      <div className="relative flex flex-1 items-center justify-center bg-[var(--color-bg)] p-4 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_360px_at_80%_-10%,color-mix(in_srgb,var(--color-accent)_10%,transparent),transparent_55%)] lg:hidden"
        />
        <div className="relative w-full max-w-[400px]">
          <div className="mb-8 text-center lg:text-start">
            <div className="mb-4 flex justify-center lg:hidden">
              <BrandMark size="lg" />
            </div>
            <h1 className="text-[1.45rem] font-extrabold tracking-tight sm:text-[1.6rem]">
              Sign in
            </h1>
            <p className="mt-1.5 text-[13px] font-medium text-[var(--color-text-muted)]">
              {t('appName')} - {t('platform')}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white/95 p-6 shadow-[0_20px_50px_-24px_rgba(16,12,8,0.28)] backdrop-blur sm:p-7">
            {errors.form ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                {errors.form}
              </div>
            ) : null}
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
              <div className="relative">
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
                  className="absolute end-1.5 top-[34px] min-h-10 min-w-10 rounded-lg p-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="flex min-h-10 items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-[var(--color-accent)]"
                  />
                  {t('login.remember')}
                </label>
                <SoftLink className="text-[13px]">{t('login.forgot')}</SoftLink>
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                {t('common.signIn')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
