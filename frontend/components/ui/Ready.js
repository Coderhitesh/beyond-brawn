'use client';
import { useEffect } from 'react';

// Flips the flag the boot script in app/layout.js waits for: from here on React handles form submits.
export default function Ready() {
  useEffect(() => {
    window.__bbReady = true;
  }, []);
  return null;
}
