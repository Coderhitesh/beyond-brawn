'use client';
import { useCallback, useEffect, useState } from 'react';

// Runs an async loader, tracks loading / error, and exposes reload.
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await loader();
      setState({ data: res.data, meta: res.meta || null, loading: false, error: null });
    } catch (e) {
      setState({ data: null, meta: null, loading: false, error: e.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}
