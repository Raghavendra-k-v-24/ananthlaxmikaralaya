import { useEffect, useRef } from "react";
import { IconAlertTriangle, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { STATUS, cn } from "@/lib/format";

export function StatusBadge({ status, className }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        s.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Spinner({ className }) {
  return <IconLoader2 aria-hidden className={cn("size-4 animate-spin", className)} />;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <IconAlertTriangle className="size-7 text-danger" />
      <p className="max-w-[42ch] text-ivory/90">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost mt-1">
          <IconRefresh className="size-4" /> Try again
        </button>
      )}
    </div>
  );
}

// A modal confirmation built on <dialog>, so focus trapping and Escape come from the browser.
export function ConfirmDialog({ open, title, children, confirmLabel, tone = "gold", busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => e.target === ref.current && !busy && onCancel()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-night-850 p-0 text-ivory shadow-2xl"
    >
      <div className="p-6">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <div className="mt-3 text-[0.95rem] leading-relaxed text-ivory-muted">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Go back
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn-danger" : "btn-gold"}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
