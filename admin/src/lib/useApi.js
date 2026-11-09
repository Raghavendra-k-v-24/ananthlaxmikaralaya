import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// GETs `path` and re-fetches when it changes. Keeps the previous data while reloading,
// so lists don't flash empty between pages or filters.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== "AbortError") setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (next) => setState((s) => ({ ...s, data: typeof next === "function" ? next(s.data) : next })),
    []
  );
  return { ...state, reload, setData };
}
