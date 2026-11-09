import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import ChakraMark from "@/assets/chakra-mark.png";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";

export default function Login() {
  const { status, signIn } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "signedIn") return <Navigate to={location.state?.from ?? "/"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(username.trim(), password);
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-10">
      {/* a soft lamp-glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[38%] left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,170,80,0.16),rgba(91,63,214,0.08)_60%,transparent)]"
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <img src={ChakraMark} alt="" className="h-16 w-auto drop-shadow-[0_6px_20px_rgba(217,166,72,0.35)]" />
          <h1 className="mt-5 font-display text-3xl font-semibold">Ananth Laxmi Mangal Karalaya</h1>
          <p className="mt-1.5 text-sm text-ivory-muted">Sign in to manage booking enquiries</p>
        </div>

        <form onSubmit={submit} noValidate className="card mt-8 flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="label">
              Username
            </label>
            <input
              id="username"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={Boolean(error) || undefined}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="input pr-12"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? "login-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-lg text-ivory-muted hover:text-ivory"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
              </button>
            </div>
          </div>

          <p id="login-error" role="alert" aria-live="polite" className="-mt-1 min-h-5 text-sm font-medium text-danger">
            {error}
          </p>

          <button type="submit" className="btn-gold -mt-2 h-11" disabled={busy}>
            {busy ? <Spinner /> : <IconLock className="size-4" aria-hidden />}
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ivory-muted/80">
          Forgot your password? Ask your website administrator to reset it.
        </p>
      </div>
    </div>
  );
}
