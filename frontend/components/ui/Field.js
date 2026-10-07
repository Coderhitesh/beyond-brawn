'use client';
import { useId } from 'react';

export default function Field({ label, error, hint, as = 'input', className = '', children, ...props }) {
  const id = useId();
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <Tag id={id} className={`input ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''}`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...props}>
        {children}
      </Tag>
      {error ? (
        <p id={`${id}-e`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-h`} className="mt-1 text-sm text-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
