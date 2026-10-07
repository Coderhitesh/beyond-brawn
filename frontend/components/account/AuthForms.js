'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Field from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fieldErrors } from '@/lib/api';
import * as authApi from '@/services/auth';
import PasswordField from './PasswordField';

// Only same-site paths are accepted as a post-login destination (prevents open redirects).
const safeNext = (v, fallback = '/account') => (v && v.startsWith('/') && !v.startsWith('//') ? v : fallback);

function FormError({ children }) {
  if (!children) return null;
  return (
    <p className="border-2 border-danger px-4 py-3 text-[15px] font-semibold text-danger" role="alert">
      {children}
    </p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser } = useAuth();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(form);
      setUser(res.data.user);
      router.replace(next);
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') return router.push(`/verify-email?email=${encodeURIComponent(form.email)}&next=${encodeURIComponent(next)}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return null;
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError>{error}</FormError>
      <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <PasswordField autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <div className="text-right">
        <Link href="/forgot-password" className="link text-sm font-semibold">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" variant="lime" loading={loading} className="w-full">
        Log in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await authApi.register(form);
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}&next=${encodeURIComponent(next)}`);
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError>{errors.form}</FormError>
      <Field label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} required />
      <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} hint="We send a 6-digit code here to verify your account" required />
      <Field label="Mobile number" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} error={errors.phone} required />
      <PasswordField autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters with a letter and a number" required />
      <Button type="submit" variant="lime" loading={loading} className="w-full">
        Create account
      </Button>
      <p className="text-sm text-mute">
        By creating an account you agree to our{' '}
        <Link href="/terms-and-conditions" className="underline">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy-policy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

// Six single-digit boxes that behave like one field: typing advances, backspace retreats, paste fills.
export function OtpInput({ value, onChange, disabled, invalid }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const focus = (i) => refs.current[i] && refs.current[i].focus();
  const setAt = (i, d) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(''));
  };
  return (
    <div className="flex gap-2" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            if (!v) return setAt(i, '');
            setAt(i, v[v.length - 1]);
            return focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i]) focus(i - 1);
            if (e.key === 'ArrowLeft') focus(i - 1);
            if (e.key === 'ArrowRight') focus(i + 1);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (text) {
              onChange(text);
              focus(Math.min(text.length, 5));
            }
          }}
          onFocus={(e) => e.target.select()}
          className={`h-14 w-full min-w-0 border-2 text-center font-display text-3xl font-black focus:border-black focus:outline-none focus:ring-2 focus:ring-lime ${invalid ? 'border-danger' : 'border-line'}`}
        />
      ))}
    </div>
  );
}

function useCountdown(initial) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return [left, setLeft];
}

function ResendButton({ email, purpose, initial = 60 }) {
  const toast = useToast();
  const [left, setLeft] = useCountdown(initial);
  const [loading, setLoading] = useState(false);
  const resend = async () => {
    setLoading(true);
    try {
      const res = await authApi.resendOtp({ email, purpose });
      toast.success('A new code is on its way');
      setLeft((res.data && res.data.resendIn) || 60);
    } catch (err) {
      toast.error(err.message);
      if (err.details && err.details.retryAfter) setLeft(err.details.retryAfter);
    } finally {
      setLoading(false);
    }
  };
  return left > 0 ? (
    <p className="text-sm text-mute" aria-live="polite">
      Resend code in {left}s
    </p>
  ) : (
    <button type="button" onClick={resend} disabled={loading} className="link cursor-pointer text-sm font-semibold">
      Resend code
    </button>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const toast = useToast();
  const email = params.get('email') || '';
  const next = safeNext(params.get('next'));
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return setError('Enter the 6-digit code');
    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyEmail({ email, otp });
      if (res.data.user) {
        setUser(res.data.user);
        toast.success('Email verified. Welcome to Beyond Brawn.');
        router.replace(next);
      } else {
        toast.success(res.message);
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    } catch (err) {
      setError(err.message);
      setOtp('');
    } finally {
      setLoading(false);
    }
    return null;
  };

  if (!email) {
    return (
      <p>
        This link is missing an email address.{' '}
        <Link href="/register" className="link font-semibold">
          Start again
        </Link>
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <p>
        Enter the code we sent to <strong className="break-all">{email}</strong>. It is valid for 10 minutes.
      </p>
      <OtpInput value={otp} onChange={setOtp} disabled={loading} invalid={Boolean(error)} />
      <FormError>{error}</FormError>
      <Button type="submit" variant="lime" loading={loading} className="w-full">
        Verify email
      </Button>
      <div className="flex items-center justify-between">
        <ResendButton email={email} purpose="verify_email" />
        <Link href="/register" className="link text-sm">
          Wrong email?
        </Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError>{error}</FormError>
      <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" variant="lime" loading={loading} className="w-full">
        Send reset code
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setErrors({ form: 'Enter the 6-digit code' });
    setLoading(true);
    setErrors({});
    try {
      const res = await authApi.resetPassword({ email, otp, password });
      toast.success(res.message);
      router.replace('/login');
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: err.message });
    } finally {
      setLoading(false);
    }
    return null;
  };

  if (!email) {
    return (
      <p>
        This link is missing an email address.{' '}
        <Link href="/forgot-password" className="link font-semibold">
          Request a reset code
        </Link>
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <p>
        If <strong className="break-all">{email}</strong> has an account, a 6-digit code was sent to it.
      </p>
      <OtpInput value={otp} onChange={setOtp} disabled={loading} invalid={Boolean(errors.form || errors.otp)} />
      <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="At least 8 characters with a letter and a number" required />
      <FormError>{errors.form || errors.otp}</FormError>
      <Button type="submit" variant="lime" loading={loading} className="w-full">
        Set new password
      </Button>
      <ResendButton email={email} purpose="reset_password" />
    </form>
  );
}
