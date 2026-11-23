"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseMode } from "../supabase/config";
import { subscribe } from "./index";

/**
 * Load data through the data layer and reload when it changes.
 *  - Demo mode: the server rendered seed data, so read the visitor's local copy on mount.
 *  - Production: server-rendered data is already live, so skip the duplicate fetch
 *    unless `fresh` is set (admin screens), but still reload after edits.
 */
export function useData<T>(loader: () => Promise<T>, initial: T, deps: unknown[] = [], opts: { fresh?: boolean } = {}) {
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(isSupabaseMode && !opts.fresh);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    try {
      setData(await loaderRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const run = () =>
      loaderRef
        .current()
        .then((d) => {
          if (alive) {
            setData(d);
            setError(null);
          }
        })
        .catch((e) => alive && setError(e instanceof Error ? e.message : "Could not load data."))
        .finally(() => alive && setReady(true));
    if (!isSupabaseMode || opts.fresh || deps.length > 0) run();
    const unsub = subscribe(() => void run());
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, ready, error, reload };
}
