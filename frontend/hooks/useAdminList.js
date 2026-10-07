'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, qs } from '@/services/admin';

/*
 * List state for admin tables: query (filters, search, page) -> fetch -> items + meta.
 * `initial` re-applies when its serialised value changes (e.g. sidebar links that change ?status=).
 */
export default function useAdminList(endpoint, initial = {}, { limit = 20 } = {}) {
  const initialKey = JSON.stringify(initial);
  const [query, setQueryState] = useState({ page: 1, ...initial });
  const [state, setState] = useState({ items: [], meta: null, extra: {}, loading: true, error: null });
  const seq = useRef(0);

  useEffect(() => {
    setQueryState({ page: 1, ...JSON.parse(initialKey) });
  }, [initialKey]);

  const load = useCallback(async () => {
    seq.current += 1;
    const mine = seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await adminApi(`${endpoint}${qs({ limit, ...query })}`);
      if (mine !== seq.current) return; // a newer request superseded this one
      const { items, ...extra } = res.data;
      setState({ items: items || [], meta: res.meta || null, extra, loading: false, error: null });
    } catch (e) {
      if (mine === seq.current) setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [endpoint, limit, query]);

  useEffect(() => {
    load();
  }, [load]);

  // Changing any filter returns to page 1.
  const setQuery = useCallback((patch) => setQueryState((q) => ({ ...q, page: 1, ...patch })), []);
  const setPage = useCallback((page) => setQueryState((q) => ({ ...q, page })), []);

  return { ...state, query, setQuery, setPage, reload: load };
}
