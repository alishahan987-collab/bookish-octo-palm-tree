"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribe } from "./index";

/**
 * Load data from the async data layer and re-load whenever it changes
 * (including changes made in another tab, e.g. admin open next to the site).
 *
 * `initial` lets server-rendered pages paint immediately with seed data;
 * `ready` becomes true once the browser copy has been read.
 */
export function useData<T>(loader: () => Promise<T>, initial: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    const next = await loaderRef.current();
    setData(next);
    setReady(true);
  }, []);

  useEffect(() => {
    let alive = true;
    loaderRef.current().then((d) => {
      if (alive) {
        setData(d);
        setReady(true);
      }
    });
    const unsub = subscribe(() => {
      loaderRef.current().then((d) => alive && setData(d));
    });
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, ready, reload };
}
