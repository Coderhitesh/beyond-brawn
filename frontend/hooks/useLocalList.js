'use client';
import { useCallback, useEffect, useState } from 'react';

// A small de-duplicated, most-recent-first list kept in localStorage (recent searches, recently viewed).
export default function useLocalList(key, max = 8) {
  const [list, setList] = useState([]);
  useEffect(() => {
    try {
      setList(JSON.parse(localStorage.getItem(key) || '[]'));
    } catch (e) {
      setList([]);
    }
  }, [key]);
  const write = useCallback(
    (next) => {
      setList(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        /* storage unavailable */
      }
    },
    [key]
  );
  const add = useCallback(
    (value) => {
      let current = [];
      try {
        current = JSON.parse(localStorage.getItem(key) || '[]');
      } catch (e) {
        /* ignore */
      }
      write([value, ...current.filter((v) => v !== value)].slice(0, max));
    },
    [key, max, write]
  );
  const clear = useCallback(() => write([]), [write]);
  return { list, add, clear };
}
