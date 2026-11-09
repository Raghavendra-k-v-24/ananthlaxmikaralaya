import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  IconCalendarCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconInbox,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { download } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { STATUS, STATUS_ORDER, cn, displayPhone, formatRange, formatShortDate, timeAgo } from "@/lib/format";
import { ErrorState, Spinner, StatusBadge } from "@/components/ui";

const DEFAULTS = { status: "all", q: "", sort: "newest", when: "any", page: "1" };

function useFilters() {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, params.get(k) ?? v]));
  const set = (patch) => {
    const next = { ...filters, page: "1", ...patch };
    // keep the URL short: only non-default values
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== DEFAULTS[k])), { replace: true });
  };
  return [filters, set];
}

const toQuery = (f) => new URLSearchParams({ ...f, limit: "20" }).toString();

export default function Enquiries() {
  const [filters, setFilters] = useFilters();
  const stats = useApi("/api/admin/stats");
  const list = useApi(`/api/admin/enquiries?${toQuery(filters)}`);
  const [exporting, setExporting] = useState(false);

  // search box updates the URL a moment after typing stops
  const [search, setSearch] = useState(filters.q);
  useEffect(() => {
    if (search.trim() === filters.q) return;
    const id = setTimeout(() => setFilters({ q: search.trim() }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  // ...and follows the URL when it changes elsewhere (Clear filters, back button)
  useEffect(() => {
    setSearch((s) => (s.trim() === filters.q ? s : filters.q));
  }, [filters.q]);

  const refresh = () => {
    stats.reload();
    list.reload();
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { page: _page, ...rest } = filters;
      await download(`/api/admin/enquiries/export.csv?${new URLSearchParams(rest)}`, "enquiries.csv");
    } catch (err) {
      toast.error("Couldn't download the spreadsheet", { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const counts = stats.data?.byStatus;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">Enquiries</h1>
          <p className="mt-1 text-ivory-muted">Booking requests sent from the website.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={refresh} aria-label="Refresh">
            <IconRefresh className={cn("size-4", (list.loading || stats.loading) && "animate-spin")} aria-hidden />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" className="btn-ghost" onClick={exportCsv} disabled={exporting}>
            {exporting ? <Spinner /> : <IconDownload className="size-4" aria-hidden />}
            Export
          </button>
        </div>
      </div>

      {/* overview: tap a card to filter by it */}
      <section aria-label="Overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["new", "contacted", "confirmed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilters({ status: filters.status === s ? "all" : s })}
            aria-pressed={filters.status === s}
            className={cn(
              "card flex flex-col items-start gap-1 p-4 text-left transition-[border-color,background-color] hover:border-white/15 md:p-5",
              filters.status === s && "border-gold-400/40 bg-night-800"
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-ivory-muted">
              <span className={cn("size-2 rounded-full", STATUS[s].dot)} />
              {STATUS[s].label}
            </span>
            <span className="font-display text-4xl font-semibold tabular-nums lining-nums">
              {counts ? counts[s] : <span className="skeleton inline-block h-9 w-10 align-middle" />}
            </span>
            <span className="text-xs text-ivory-muted">{STATUS[s].hint}</span>
          </button>
        ))}
        <div className="card flex flex-col items-start gap-1 p-4 md:p-5">
          <span className="text-sm font-semibold text-ivory-muted">Last 7 days</span>
          <span className="font-display text-4xl font-semibold tabular-nums lining-nums">
            {stats.data ? stats.data.last7Days : <span className="skeleton inline-block h-9 w-10 align-middle" />}
          </span>
          <span className="text-xs text-ivory-muted">New enquiries received</span>
        </div>
      </section>

      {stats.data?.upcoming?.length > 0 && <Upcoming items={stats.data.upcoming} />}

      <section aria-label="Enquiry list" className="flex flex-col gap-4">
        {/* filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="tablist" aria-label="Status" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
            {["all", ...STATUS_ORDER].map((s) => {
              const active = filters.status === s;
              const count = s === "all" ? stats.data?.total : counts?.[s];
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilters({ status: s })}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors",
                    active ? "bg-ivory text-night-950" : "text-ivory/70 hover:bg-white/[0.06] hover:text-ivory"
                  )}
                >
                  {s === "all" ? "All" : STATUS[s].label}
                  {count !== undefined && (
                    <span className={cn("text-xs tabular-nums", active ? "text-night-950/60" : "text-ivory-muted")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <div className="relative sm:max-w-xs sm:flex-1">
              <IconSearch aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ivory-muted" />
              <input
                type="search"
                className="input h-10 pr-9 pl-10"
                placeholder="Search name, phone, occasion"
                aria-label="Search enquiries"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ivory-muted hover:text-ivory"
                  aria-label="Clear search"
                >
                  <IconX className="size-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                className="input h-10 w-auto min-w-0 flex-1 pr-8"
                aria-label="Event date"
                value={filters.when}
                onChange={(e) => setFilters({ when: e.target.value })}
              >
                <option value="any">Any event date</option>
                <option value="upcoming">Upcoming events</option>
                <option value="past">Past events</option>
              </select>
              <select
                className="input h-10 w-auto min-w-0 flex-1 pr-8"
                aria-label="Sort by"
                value={filters.sort}
                onChange={(e) => setFilters({ sort: e.target.value })}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="eventDate">By event date</option>
              </select>
            </div>
          </div>
        </div>

        <List list={list} filters={filters} setFilters={setFilters} />
      </section>
    </div>
  );
}

function Upcoming({ items }) {
  return (
    <section aria-label="Upcoming confirmed bookings" className="card p-4 md:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
        <IconCalendarCheck className="size-4" aria-hidden /> Upcoming confirmed bookings
      </h2>
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {items.map((e) => (
          <li key={e.id} className="shrink-0">
            <Link
              to={`/enquiries/${e.id}`}
              className="flex flex-col rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-3.5 py-2.5 transition-colors hover:border-emerald-400/35"
            >
              <span className="text-sm font-semibold">{formatRange(e.startDate, e.endDate)}</span>
              <span className="text-xs text-ivory-muted">
                {e.name} · {e.occasion}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function List({ list, filters, setFilters }) {
  const navigate = useNavigate();
  const { data, error, loading } = list;

  if (error && !data) return <ErrorState message={error.message} onRetry={list.reload} />;

  if (!data) {
    return (
      <div className="card divide-y divide-white/[0.06]" aria-busy="true" aria-label="Loading enquiries">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-3 w-64 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.items.length === 0) {
    const filtered = filters.status !== "all" || filters.q || filters.when !== "any";
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <IconInbox className="size-8 text-ivory-muted" aria-hidden />
        <p className="font-semibold">{filtered ? "No enquiries match these filters" : "No enquiries yet"}</p>
        <p className="max-w-[40ch] text-sm text-ivory-muted">
          {filtered
            ? "Try another status or clear the search."
            : "When someone sends the booking form on the website, it will appear here."}
        </p>
        {filtered && (
          <button type="button" className="btn-ghost mt-1" onClick={() => setFilters({ status: "all", q: "", when: "any" })}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  const page = data.page;
  const from = (page - 1) * data.limit + 1;
  const to = from + data.items.length - 1;

  return (
    <div className={cn("flex flex-col gap-3 transition-opacity", loading && "opacity-60")}>
      {/* wide screens: a table */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.07] text-xs font-semibold tracking-wide text-ivory-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Event dates</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Received</th>
              <th className="px-5 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {data.items.map((e) => (
              <tr
                key={e.id}
                onClick={() => navigate(`/enquiries/${e.id}`)}
                className="cursor-pointer transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-5 py-3.5">
                  <Link to={`/enquiries/${e.id}`} className="font-semibold text-ivory hover:text-gold-200" onClick={(ev) => ev.stopPropagation()}>
                    {e.name}
                  </Link>
                  <div className="text-xs text-ivory-muted">{e.occasion}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div>{formatRange(e.startDate, e.endDate)}</div>
                  <div className="text-xs text-ivory-muted">
                    {e.days} day{e.days > 1 ? "s" : ""}
                  </div>
                </td>
                <td className="px-4 py-3.5 tabular-nums">{displayPhone(e.phone)}</td>
                <td className="px-4 py-3.5 text-ivory-muted" title={new Date(e.createdAt).toLocaleString()}>
                  {timeAgo(e.createdAt)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones: cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {data.items.map((e) => (
          <li key={e.id}>
            <Link to={`/enquiries/${e.id}`} className="card flex flex-col gap-2 p-4 active:bg-night-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="text-xs text-ivory-muted">{e.occasion}</p>
                </div>
                <StatusBadge status={e.status} className="shrink-0" />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {formatShortDate(e.startDate)}
                  {e.days > 1 && <span className="text-ivory-muted"> · {e.days} days</span>}
                </span>
                <span className="text-xs text-ivory-muted">{timeAgo(e.createdAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 text-sm text-ivory-muted">
        <span className="tabular-nums">
          {from}–{to} of {data.total}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost h-9 px-3"
            disabled={page <= 1}
            onClick={() => setFilters({ page: String(page - 1) })}
          >
            <IconChevronLeft className="size-4" aria-hidden /> Previous
          </button>
          <button
            type="button"
            className="btn-ghost h-9 px-3"
            disabled={page >= data.pages}
            onClick={() => setFilters({ page: String(page + 1) })}
          >
            Next <IconChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
