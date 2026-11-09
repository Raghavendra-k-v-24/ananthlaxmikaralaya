import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconMail,
  IconMailCheck,
  IconPhone,
  IconTrash,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import {
  LANGUAGE,
  STATUS,
  STATUS_ORDER,
  cn,
  displayPhone,
  formatDateTime,
  formatRange,
  telLink,
  timeAgo,
  whatsappLink,
} from "@/lib/format";
import { ConfirmDialog, ErrorState, Spinner, StatusBadge } from "@/components/ui";

export default function EnquiryDetail() {
  const { id } = useParams();
  const { data, error, reload, setData } = useApi(`/api/admin/enquiries/${id}`);

  if (error && !data) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <ErrorState message={error.message} onRetry={error.status === 404 ? undefined : reload} />
      </div>
    );
  }
  if (!data || data.enquiry.id !== id) return <DetailSkeleton />;
  return <Detail key={id} enquiry={data.enquiry} clashes={data.clashes} emailEnabled={data.emailEnabled} onChange={setData} />;
}

function BackLink() {
  return (
    <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ivory-muted hover:text-ivory">
      <IconArrowLeft className="size-4" aria-hidden /> All enquiries
    </Link>
  );
}

function Detail({ enquiry, clashes, emailEnabled, onChange }) {
  const navigate = useNavigate();
  const [savingStatus, setSavingStatus] = useState(null);
  const [overlap, setOverlap] = useState(null); // confirmed bookings blocking a confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const update = (body) => api(`/api/admin/enquiries/${enquiry.id}`, { method: "PATCH", body });

  const changeStatus = async (status, force = false) => {
    if (status === enquiry.status) return;
    setSavingStatus(status);
    try {
      const next = await update({ status, force });
      onChange(next);
      setOverlap(null);
      toast.success(`Marked as ${STATUS[status].label.toLowerCase()}`);
    } catch (err) {
      if (err.status === 409) setOverlap(err.body.clashes ?? []);
      else toast.error("Couldn't change the status", { description: err.message });
    } finally {
      setSavingStatus(null);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/admin/enquiries/${enquiry.id}`, { method: "DELETE" });
      toast.success("Enquiry deleted");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error("Couldn't delete the enquiry", { description: err.message });
      setDeleting(false);
    }
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(`+91${enquiry.phone}`);
      toast.success("Phone number copied");
    } catch {
      toast.error("Couldn't copy. Select the number instead.");
    }
  };

  const confirmedClashes = clashes.filter((c) => c.status === "confirmed");

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {/* heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-semibold break-words">{enquiry.name}</h1>
            <StatusBadge status={enquiry.status} />
          </div>
          <p className="mt-1.5 text-sm text-ivory-muted">
            {enquiry.occasion} · received {timeAgo(enquiry.createdAt)}
          </p>
        </div>
      </div>

      {/* quick contact */}
      <div className="flex flex-wrap gap-2">
        <a href={telLink(enquiry.phone)} className="btn-gold">
          <IconPhone className="size-4" aria-hidden /> Call
        </a>
        <a href={whatsappLink(enquiry)} target="_blank" rel="noreferrer" className="btn-ghost">
          <IconBrandWhatsapp className="size-4 text-emerald-300" aria-hidden /> WhatsApp
        </a>
        {enquiry.email && (
          <a href={`mailto:${enquiry.email}`} className="btn-ghost">
            <IconMail className="size-4" aria-hidden /> Email
          </a>
        )}
        <button type="button" onClick={copyPhone} className="btn-ghost">
          <IconCopy className="size-4" aria-hidden /> Copy number
        </button>
      </div>

      {confirmedClashes.length > 0 && enquiry.status !== "confirmed" && (
        <div role="status" className="flex gap-3 rounded-2xl border border-danger/30 bg-danger/[0.08] p-4 text-sm">
          <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <p>
            <span className="font-semibold text-ivory">The hall is already booked on some of these dates.</span>{" "}
            <span className="text-ivory-muted">See the confirmed booking below before confirming this one.</span>
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {/* details */}
          <section aria-labelledby="details-h" className="card p-5 md:p-6">
            <h2 id="details-h" className="text-sm font-semibold tracking-wide text-ivory-muted uppercase">
              Booking details
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Item label="Event dates">
                {formatRange(enquiry.startDate, enquiry.endDate)}
                <span className="block text-sm text-ivory-muted">
                  {enquiry.days} day{enquiry.days > 1 ? "s" : ""}
                </span>
              </Item>
              <Item label="Occasion">{enquiry.occasion}</Item>
              <Item label="Phone">
                <a href={telLink(enquiry.phone)} className="tabular-nums hover:text-gold-200">
                  {displayPhone(enquiry.phone)}
                </a>
              </Item>
              <Item label="Email">
                {enquiry.email ? (
                  <a href={`mailto:${enquiry.email}`} className="break-all hover:text-gold-200">
                    {enquiry.email}
                  </a>
                ) : (
                  <span className="text-ivory-muted">Not given</span>
                )}
              </Item>
              <Item label="Form language">{LANGUAGE[enquiry.language] ?? enquiry.language}</Item>
              <Item label="Received">{formatDateTime(enquiry.createdAt)}</Item>
            </dl>
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <h3 className="text-sm font-semibold text-ivory-muted">Message from the visitor</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-ivory/90">
                {enquiry.notes || <span className="text-ivory-muted">No message.</span>}
              </p>
            </div>
          </section>

          <Notes key={enquiry.adminNotes} enquiry={enquiry} update={update} onChange={onChange} />
        </div>

        <div className="flex flex-col gap-6">
          {/* status */}
          <section aria-labelledby="status-h" className="card p-5 md:p-6">
            <h2 id="status-h" className="text-sm font-semibold tracking-wide text-ivory-muted uppercase">
              Status
            </h2>
            <div role="radiogroup" aria-labelledby="status-h" className="mt-4 grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((s) => {
                const active = enquiry.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={savingStatus !== null}
                    onClick={() => changeStatus(s)}
                    className={cn(
                      "flex h-auto min-h-14 flex-col items-start justify-center rounded-xl border px-3.5 py-2.5 text-left transition-[border-color,background-color]",
                      active
                        ? cn("ring-1 ring-inset", STATUS[s].badge, "border-transparent")
                        : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {savingStatus === s ? <Spinner className="size-3.5" /> : active ? <IconCheck className="size-3.5" /> : <span className={cn("size-2 rounded-full", STATUS[s].dot)} />}
                      {STATUS[s].label}
                    </span>
                    <span className={cn("text-xs", active ? "opacity-80" : "text-ivory-muted")}>{STATUS[s].hint}</span>
                  </button>
                );
              })}
            </div>
            {enquiry.status === "confirmed" && emailEnabled && (
              <ConfirmationEmail enquiry={enquiry} onChange={onChange} />
            )}
          </section>

          {/* same dates */}
          <section aria-labelledby="clash-h" className="card p-5 md:p-6">
            <h2 id="clash-h" className="text-sm font-semibold tracking-wide text-ivory-muted uppercase">
              Others for these dates
            </h2>
            {clashes.length === 0 ? (
              <p className="mt-3 text-sm text-ivory-muted">No other open enquiries overlap these dates.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {clashes.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/enquiries/${c.id}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors hover:bg-white/[0.03]",
                        c.status === "confirmed" ? "border-danger/30" : "border-white/[0.08]"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{c.name}</span>
                        <span className="block text-xs text-ivory-muted">{formatRange(c.startDate, c.endDate)}</span>
                      </span>
                      <StatusBadge status={c.status} className="shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* history */}
          <section aria-labelledby="activity-h" className="card p-5 md:p-6">
            <h2 id="activity-h" className="text-sm font-semibold tracking-wide text-ivory-muted uppercase">
              History
            </h2>
            <ol className="mt-4 flex flex-col gap-3 border-l border-white/10 pl-4">
              {[...enquiry.activity].reverse().map((a, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-gold-400/70 ring-4 ring-night-900" />
                  <p className="text-ivory/90">{describe(a)}</p>
                  <p className="text-xs text-ivory-muted">
                    {a.by === "website" ? "Website" : a.by === "system" ? "Automatic" : a.by} · {formatDateTime(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <button type="button" className="btn-danger self-start" onClick={() => setConfirmDelete(true)}>
            <IconTrash className="size-4" aria-hidden /> Delete enquiry
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={overlap !== null}
        title="These dates are already booked"
        confirmLabel="Confirm anyway"
        busy={savingStatus === "confirmed"}
        onCancel={() => setOverlap(null)}
        onConfirm={() => changeStatus("confirmed", true)}
      >
        <p>The hall is confirmed for another booking on overlapping dates:</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {(overlap ?? []).map((c) => (
            <li key={c.id} className="rounded-lg bg-white/[0.04] px-3 py-2 text-ivory">
              <span className="font-semibold">{c.name}</span>
              <span className="text-ivory-muted"> · {formatRange(c.startDate, c.endDate)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">Only confirm this one too if both events can share the hall.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this enquiry?"
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      >
        {enquiry.name}&apos;s enquiry for {formatRange(enquiry.startDate, enquiry.endDate)} will be removed for good. To
        keep a record instead, mark it as cancelled.
      </ConfirmDialog>
    </div>
  );
}

function describe(a) {
  if (a.action === "created") return "Enquiry received from the website";
  if (a.action === "notes") return "Updated the notes";
  if (a.action === "status") {
    const [from, to] = a.detail.split(" → ");
    return `Status changed from ${STATUS[from]?.label ?? from} to ${STATUS[to]?.label ?? to}`;
  }
  return a.detail || a.action;
}

// Once a booking is confirmed, the customer can be sent a confirmation email (never automatically).
function ConfirmationEmail({ enquiry, onChange }) {
  const [sending, setSending] = useState(false);
  const sentBefore = enquiry.activity.some((a) => a.action === "email" && a.detail.startsWith("Booking confirmation"));

  if (!enquiry.email) {
    return (
      <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm text-ivory-muted">
        No email address was given, so let the customer know by phone or WhatsApp.
      </p>
    );
  }

  const send = async () => {
    setSending(true);
    try {
      onChange(await api(`/api/admin/enquiries/${enquiry.id}/send-confirmation`, { method: "POST" }));
      toast.success("Confirmation email sent", { description: enquiry.email });
    } catch (err) {
      toast.error("Couldn't send the email", { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
      <button type="button" onClick={send} disabled={sending} className={sentBefore ? "btn-ghost" : "btn-gold"}>
        {sending ? <Spinner /> : <IconMailCheck className="size-4" aria-hidden />}
        {sentBefore ? "Send confirmation email again" : "Email booking confirmation"}
      </button>
      <p className="text-xs text-ivory-muted">
        {sentBefore ? "Already sent; see History below. " : ""}Goes to {enquiry.email}, in the language they used on the website.
      </p>
    </div>
  );
}

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-ivory-muted">{label}</dt>
      <dd className="mt-0.5 text-[0.98rem]">{children}</dd>
    </div>
  );
}

// Private notes for the owner: advance paid, menu, decorations agreed, etc.
function Notes({ enquiry, update, onChange }) {
  const [text, setText] = useState(enquiry.adminNotes);
  const [saving, setSaving] = useState(false);
  const dirty = text !== enquiry.adminNotes;

  // warn before closing the tab with unsaved notes
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      onChange(await update({ adminNotes: text }));
      toast.success("Notes saved");
    } catch (err) {
      toast.error("Couldn't save the notes", { description: err.message });
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card flex flex-col gap-3 p-5 md:p-6">
      <label htmlFor="admin-notes" className="text-sm font-semibold tracking-wide text-ivory-muted uppercase">
        Your notes
      </label>
      <textarea
        id="admin-notes"
        rows={5}
        maxLength={4000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Advance received, menu, decoration, guest count… Only admins see this."
        className="input h-auto min-h-32 resize-y py-3 leading-relaxed"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ivory-muted">{dirty ? "Unsaved changes" : "Saved"}</span>
        <div className="flex gap-2">
          {dirty && (
            <button type="button" className="btn-ghost h-9" onClick={() => setText(enquiry.adminNotes)} disabled={saving}>
              Discard
            </button>
          )}
          <button type="submit" className="btn-gold h-9" disabled={!dirty || saving}>
            {saving && <Spinner />} Save notes
          </button>
        </div>
      </div>
    </form>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading enquiry">
      <BackLink />
      <div className="skeleton h-10 w-64" />
      <div className="flex gap-2">
        <div className="skeleton h-10 w-24 rounded-full" />
        <div className="skeleton h-10 w-32 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}
