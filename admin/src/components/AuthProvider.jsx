import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, setUnauthorizedHandler, tokenStore } from "@/lib/api";
import { AuthContext } from "@/lib/auth-context";

export default function AuthProvider({ children }) {
  // "checking" while a saved session is verified on load
  const [state, setState] = useState(() =>
    tokenStore.get() ? { status: "checking", admin: null } : { status: "signedOut", admin: null }
  );

  const signOut = useCallback((message) => {
    tokenStore.clear();
    setState({ status: "signedOut", admin: null });
    if (message) toast.info(message);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((message) => signOut(message ?? "Your session has expired. Please sign in again."));
  }, [signOut]);

  useEffect(() => {
    if (state.status !== "checking") return;
    let cancelled = false;
    api("/api/auth/me")
      .then(({ admin }) => !cancelled && setState({ status: "signedIn", admin }))
      .catch((err) => {
        if (cancelled) return;
        // Offline or server down: keep the token and let the screens show the error
        if (err.status === 0 || err.status >= 500) setState({ status: "signedIn", admin: null });
        else signOut();
      });
    return () => {
      cancelled = true;
    };
  }, [state.status, signOut]);

  const signIn = useCallback(async (username, password) => {
    const { token, admin } = await api("/api/auth/login", { method: "POST", body: { username, password } });
    tokenStore.set(token);
    setState({ status: "signedIn", admin });
    return admin;
  }, []);

  // After a password change the server issues a fresh token for this session
  const replaceSession = useCallback(({ token, admin }) => {
    tokenStore.set(token);
    setState({ status: "signedIn", admin });
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, replaceSession }),
    [state, signIn, signOut, replaceSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
