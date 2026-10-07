'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import Field from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { fieldErrors } from '@/lib/api';
import { contact } from '@/services/catalog';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'loading', message: '' });
    setErrors({});
    try {
      const res = await contact(form);
      setStatus({ state: 'done', message: res.message });
      setForm(EMPTY);
    } catch (err) {
      setErrors(fieldErrors(err));
      setStatus({ state: 'error', message: err.message });
    }
  };

  if (status.state === 'done') {
    return (
      <div className="border-2 border-black p-6" role="status">
        <p className="flex items-center gap-2 font-display text-3xl font-black uppercase leading-none">
          <span className="flex size-8 items-center justify-center bg-lime">
            <Check className="size-5" strokeWidth={3} aria-hidden />
          </span>
          Message sent
        </p>
        <p className="mt-2 text-mute">{status.message}</p>
        <button type="button" className="link mt-4 cursor-pointer font-semibold" onClick={() => setStatus({ state: 'idle', message: '' })}>
          Send another message
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Name" value={form.name} onChange={set('name')} autoComplete="name" error={errors.name} required />
      <Field label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" error={errors.email} required />
      <Field label="Mobile number (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" error={errors.phone} />
      <Field label="Subject (optional)" value={form.subject} onChange={set('subject')} error={errors.subject} placeholder="Order BB-2026-000123" />
      <Field as="textarea" rows={6} className="sm:col-span-2" label="Message" value={form.message} onChange={set('message')} error={errors.message} maxLength={4000} required hint="For order questions, include your order number." />
      {status.state === 'error' && !Object.keys(errors).length && (
        <p className="field-error sm:col-span-2" role="alert">
          {status.message}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" variant="lime" loading={status.state === 'loading'}>
          Send message
        </Button>
      </div>
    </form>
  );
}
