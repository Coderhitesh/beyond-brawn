'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { subscribe } from '@/services/catalog';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', message: '' });
    try {
      const res = await subscribe(email);
      setState({ status: 'done', message: res.message });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };

  if (state.status === 'done') {
    return (
      <p className="flex items-center gap-2 text-lg font-semibold" role="status">
        <Check className="size-5" aria-hidden />
        {state.message}
      </p>
    );
  }
  return (
    <form onSubmit={submit} noValidate={false}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input id="newsletter-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full border-2 border-black bg-white px-4 text-base placeholder:text-mute/70 focus:outline-none focus:ring-2 focus:ring-black sm:max-w-sm" />
        <Button type="submit" variant="black" loading={state.status === 'loading'}>
          Subscribe
        </Button>
      </div>
      {state.status === 'error' && (
        <p className="mt-2 text-sm font-semibold" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
