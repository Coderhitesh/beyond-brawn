import Link from 'next/link';

export function EmptyState({ icon: Icon, title, text, action, onAction, href }) {
  return (
    <div className="flex flex-col items-center border border-dashed border-line px-6 py-16 text-center">
      {Icon && <Icon className="mb-4 size-10 text-mute" strokeWidth={1.5} aria-hidden />}
      <h2 className="font-display text-3xl font-black uppercase leading-none">{title}</h2>
      {text && <p className="mt-2 max-w-md text-mute">{text}</p>}
      {action && href && (
        <Link href={href} className="btn btn-lime mt-6">
          {action}
        </Link>
      )}
      {action && onAction && (
        <button type="button" onClick={onAction} className="btn btn-lime mt-6">
          {action}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message = 'This did not load.', onRetry }) {
  return (
    <div className="border-2 border-black px-6 py-10 text-center" role="alert">
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline btn-sm mt-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-square" />
          <div className="skeleton mt-3 h-4 w-3/4" />
          <div className="skeleton mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function Lines({ rows = 4 }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-16" />
      ))}
    </div>
  );
}
