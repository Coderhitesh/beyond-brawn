import Logo from '@/components/ui/Logo';

// Two-column frame for login / register / OTP / password pages. The brand panel hides on small screens.
export default function AuthShell({ title, text, children, footer, logoDarkUrl }) {
  return (
    <div className="container-site grid gap-0 py-8 sm:py-14 lg:grid-cols-[1fr_1.1fr]">
      <div className="on-dark hidden flex-col justify-between bg-black p-10 text-white lg:flex">
        <Logo src={logoDarkUrl} dark />
        <div>
          <p className="display text-7xl">Results that speak through</p>
          <dl className="mt-8 border-t-[6px] border-lime">
            {[
              ['Track every order', 'Live status and invoices'],
              ['Faster checkout', 'Saved addresses'],
              ['Verified reviews', 'Rate what you have used'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-white/30 py-2.5 text-[15px]">
                <dt className="font-bold">{k}</dt>
                <dd className="text-white/70">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-2 border-black p-6 sm:p-10 lg:border-l-0">
        <div className="mx-auto max-w-md">
          <h1 className="display text-5xl sm:text-6xl">{title}</h1>
          {text && <p className="mt-2 text-mute">{text}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 border-t border-line pt-5 text-[15px]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
