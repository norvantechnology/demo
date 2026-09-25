import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ClipboardList,
  FileText,
  Wallet,
  Printer,
  Layers,
  Palette,
  Scissors,
  Image,
  Stamp,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { BrandMark, SoftLink } from '../components/ui';
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../lib/api';

const HIGHLIGHTS = [
  { icon: ClipboardList, label: 'Job orders' },
  { icon: FileText, label: 'Invoices' },
  { icon: Wallet, label: 'Payroll' },
];

const FLOAT_ICONS = [
  { icon: Printer, label: 'Press' },
  { icon: Layers, label: 'Layers' },
  { icon: Palette, label: 'Colour' },
  { icon: Scissors, label: 'Finish' },
  { icon: Image, label: 'Artwork' },
  { icon: Stamp, label: 'Proof' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login-page">
      <aside className="login-brand" aria-label={t('appName')}>
        <div aria-hidden className="login-brand-shade" />
        <div aria-hidden className="login-brand-pattern" />

        <div className="login-brand-layout">
          <div className="login-brand-inner">
            <div className="login-brand-hero login-rise" style={{ '--i': 0 }}>
              <BrandMark size="lg" className="login-brand-mark" />
              <div className="login-brand-copy">
                <p className="login-brand-eyebrow">{t('platform')}</p>
                <h1 className="login-brand-title">{t('appName')}</h1>
              </div>
            </div>

            <p className="login-brand-tagline login-rise" style={{ '--i': 1 }}>
              Jobs, invoices, and payroll in one shop workspace.
            </p>

            <ul className="login-highlights login-rise" style={{ '--i': 2 }} aria-label="Workspace areas">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="login-float-rail" aria-hidden>
            {FLOAT_ICONS.map(({ icon: Icon, label }, i) => (
              <span
                key={label}
                className="login-float"
                style={{ '--i': i }}
                title={label}
              >
                <Icon strokeWidth={1.75} />
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-main-inner">
          <div className="login-card login-rise" style={{ '--i': 1 }}>
            <header className="login-heading">
              <h2>Sign in</h2>
              <p>Enter your shop credentials to continue</p>
            </header>

            {errors.form ? (
              <div className="login-alert" role="alert">
                {errors.form}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor={emailId}>
                  {t('login.email')}
                </label>
                <div className="login-input-wrap">
                  <Mail className="login-input-icon" strokeWidth={1.75} aria-hidden />
                  <input
                    id={emailId}
                    className={`login-input ${errors.email ? 'is-invalid' : ''}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((x) => ({ ...x, email: undefined, form: undefined }));
                    }}
                    placeholder="you@company.com"
                    autoComplete="username"
                    inputMode="email"
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? `${emailId}-err` : undefined}
                  />
                </div>
                {errors.email ? (
                  <p id={`${emailId}-err`} className="login-error">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor={passwordId}>
                  {t('login.password')}
                </label>
                <div className="login-input-wrap">
                  <Lock className="login-input-icon" strokeWidth={1.75} aria-hidden />
                  <input
                    id={passwordId}
                    className={`login-input login-input-password ${errors.password ? 'is-invalid' : ''}`}
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((x) => ({ ...x, password: undefined, form: undefined }));
                    }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? `${passwordId}-err` : undefined}
                  />
                  <button
                    type="button"
                    className="login-toggle"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p id={`${passwordId}-err`} className="login-error">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <div className="login-meta">
                <label className="login-remember" htmlFor={rememberId}>
                  <input
                    id={rememberId}
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>{t('login.remember')}</span>
                </label>
                <SoftLink className="login-forgot">{t('login.forgot')}</SoftLink>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="login-spinner" aria-hidden />
                    <span className="sr-only">Signing in</span>
                  </>
                ) : (
                  t('common.signIn')
                )}
              </button>
            </form>
          </div>

          <ul className="login-mobile-features login-rise" style={{ '--i': 2 }} aria-label="Workspace areas">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span className="login-mobile-feature-icon">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
