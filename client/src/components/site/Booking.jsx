import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { differenceInCalendarDays, format, startOfToday } from "date-fns";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconCalendarEvent,
  IconChevronDown,
  IconPhoneCall,
  IconSend,
} from "@tabler/icons-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmblemImage from "@/assets/emblem-gold.png";
import Reveal from "./Reveal";
import { OCCASIONS, SITE } from "@/lib/site";
import { EnquiryNotConfiguredError, submitEnquiry } from "@/lib/enquiry";
import { EASE_OUT, useMediaQuery } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageContext";

const STEP_ICONS = [IconCalendarEvent, IconSend, IconPhoneCall];


const EMPTY = { name: "", phone: "", email: "", occasion: "Wedding", otherOccasion: "", notes: "" };

function formatRange(range, copy, locale) {
  if (!range?.from) return null;
  const to = range.to ?? range.from;
  const days = differenceInCalendarDays(to, range.from) + 1;
  if (days === 1) return format(range.from, copy.singleDay, { locale });
  return copy.range(format(range.from, "d MMM", { locale }), format(to, "d MMM yyyy", { locale }), days);
}

// Returns error keys; messages are looked up in the current language at render
function validate(values, range) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = true;
  const digits = values.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) errors.phone = true;
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = true;
  if (!range?.from) errors.dates = true;
  if (values.occasion === "Other" && !values.otherOccasion.trim()) errors.otherOccasion = true;
  return errors;
}

function Field({ label, optional, error, hint, children, id, className }) {
  const { t } = useLang();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ivory/90">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ivory-muted">{t.booking.optional}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[0.82rem] font-medium text-[#f6a296]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.82rem] text-ivory-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SuccessPanel({ submitted, onReset }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, transform: reduce ? "none" : "translateY(12px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="flex flex-col items-center py-8 text-center"
      role="status"
    >
      <div className="relative flex size-28 items-center justify-center">
        {!reduce &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-gold-400/50"
              initial={{ opacity: 0.7, transform: "scale(0.6)" }}
              animate={{ opacity: 0, transform: "scale(1.6)" }}
              transition={{ duration: 2.4, ease: EASE_OUT, repeat: Infinity, delay: i * 0.8 }}
            />
          ))}
        <span className="absolute inset-4 rounded-full bg-[radial-gradient(closest-side,rgba(255,196,100,0.7),transparent)] blur-md" />
        <svg viewBox="0 0 48 48" className="relative size-14 text-gold-300" aria-hidden>
          <motion.path
            d="M12 25 L21 34 L37 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.2 }}
          />
        </svg>
      </div>
      <h3 className="mt-6 font-display text-[2.2rem] font-semibold leading-tight text-ivory">
        {t.booking.success.title(submitted.name.split(" ")[0])}
      </h3>
      <p className="mt-3 max-w-[40ch] leading-relaxed text-ivory-muted">
        {t.booking.success.body(submitted.dates, submitted.phone)}
      </p>
      <button type="button" onClick={onReset} className="btn-ghost mt-8">
        {t.booking.success.again}
      </button>
    </motion.div>
  );
}

export default function Booking() {
  const { t, lang, dateLocale } = useLang();
  const copy = t.booking;
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    phone: `${uid}-phone`,
    email: `${uid}-email`,
    dates: `${uid}-dates`,
    other: `${uid}-other`,
    notes: `${uid}-notes`,
  };
  const twoMonths = useMediaQuery("(min-width: 768px)");
  const [values, setValues] = useState(EMPTY);
  const [range, setRange] = useState();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const update = (key) => (e) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (attempted) setErrors(validate(next, range));
  };

  const onRange = (next) => {
    setRange(next);
    if (attempted) setErrors(validate(values, next));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setAttempted(true);
    const found = validate(values, range);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(ids[first === "otherOccasion" ? "other" : first])?.focus();
      return;
    }

    const to = range.to ?? range.from;
    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || null,
      startDate: format(range.from, "yyyy-MM-dd"),
      endDate: format(to, "yyyy-MM-dd"),
      occasion: values.occasion === "Other" ? values.otherOccasion.trim() : values.occasion,
      language: lang,
      notes: values.notes.trim() || null,
      submittedAt: new Date().toISOString(),
      website: e.currentTarget.elements.website?.value ?? "",
    };

    setSending(true);
    try {
      await submitEnquiry(payload);
      setSubmitted({ name: payload.name, phone: payload.phone, range });
      toast.success(copy.toast.sent, { description: copy.toast.sentBody });
    } catch (err) {
      console.error(err);
      toast.error(copy.toast.failed, {
        description:
          err instanceof EnquiryNotConfiguredError
            ? copy.toast.notConfigured
            : err.status === 429
              ? copy.toast.tooMany
              : err.status >= 400 && err.status < 500
                ? copy.toast.rejected
                : err.status >= 500
                  ? copy.toast.server
                  : copy.toast.network,
      });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setValues(EMPTY);
    setRange(undefined);
    setErrors({});
    setAttempted(false);
    setSubmitted(null);
  };

  const describedBy = (key, id) => (errors[key] ? `${id}-error` : undefined);
  const rangeLabel = formatRange(range, copy, dateLocale);
  const errorText = (key) => (errors[key] ? copy.errors[key] : undefined);

  return (
    <section id="enquire" className="relative overflow-hidden bg-night-950 py-24 md:py-32">
      {/* glows fade in from the section's top and bottom edges so they never end in a hard line */}
      <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_80%,transparent)]">
        <div className="absolute -right-40 top-40 h-[36rem] w-[36rem] rounded-full bg-gold-500/12 blur-[140px]" />
        <div className="absolute -left-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#4a36b8]/14 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:pt-6">
          <Reveal>
            <img src={EmblemImage} alt="" className="h-14 w-auto md:h-16" />
            <h2 className="mt-8 font-display text-4xl font-medium leading-[1.08] text-ivory md:text-[3.4rem]">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ivory-muted">
              {copy.body}
            </p>
          </Reveal>

          <ol className="mt-12 flex flex-col gap-7">
            {copy.steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
              <Reveal as="li" key={i} delay={0.1 + i * 0.08} className="flex gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-night-800 text-gold-300">
                  <Icon size={22} stroke={1.6} />
                </span>
                <div>
                  <h3 className="text-[1.05rem] font-semibold text-ivory">{step.title}</h3>
                  <p className="mt-1 max-w-[40ch] leading-relaxed text-ivory-muted">{step.body}</p>
                </div>
              </Reveal>
              );
            })}
          </ol>

          {SITE.phone && (
            <Reveal delay={0.35}>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="mt-10 inline-flex items-center gap-3 rounded-full border border-gold-400/25 bg-night-800/60 py-2 pl-2 pr-5 text-ivory/90 transition-colors hover:border-gold-400/50 hover:text-ivory"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-night-950">
                  <IconPhoneCall size={18} stroke={2} />
                </span>
                <span>
                  {copy.callPrompt} <span className="font-semibold text-gold-300">{SITE.phone}</span>
                </span>
              </a>
            </Reveal>
          )}

        </div>

        <Reveal delay={0.1}>
          <div className="relative rounded-[26px] bg-gradient-to-b from-gold-400/40 via-gold-400/10 to-gold-400/5 p-px shadow-[0_50px_120px_-40px_rgba(217,166,72,0.35)]">
            <div className="rounded-[25px] bg-night-900/95 p-6 backdrop-blur-xl sm:p-8 md:p-10">
              <AnimatePresence mode="wait" initial={false}>
                {submitted ? (
                  <SuccessPanel
                    key="done"
                    submitted={{ ...submitted, dates: formatRange(submitted.range, copy, dateLocale) }}
                    onReset={reset}
                  />
                ) : (
                  <motion.form
                    key="form"
                    noValidate
                    onSubmit={onSubmit}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-6 sm:grid-cols-2"
                  >
                    {/* left empty by people, filled in by spam bots; the server discards those */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label>
                        Website
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
                      </label>
                    </div>
                    <Field id={ids.name} label={copy.name} error={errorText("name")} className="sm:col-span-2">
                      <input
                        id={ids.name}
                        name="name"
                        autoComplete="name"
                        className="field"
                        placeholder={copy.namePh}
                        value={values.name}
                        onChange={update("name")}
                        aria-invalid={!!errors.name}
                        aria-describedby={describedBy("name", ids.name)}
                      />
                    </Field>

                    <Field id={ids.phone} label={copy.phone} error={errorText("phone")}>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ivory-muted">+91</span>
                        <input
                          id={ids.phone}
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          className="field pl-14"
                          placeholder="98765 43210"
                          value={values.phone}
                          onChange={update("phone")}
                          aria-invalid={!!errors.phone}
                          aria-describedby={describedBy("phone", ids.phone)}
                        />
                      </div>
                    </Field>

                    <Field id={ids.email} label={copy.email} optional error={errorText("email")}>
                      <input
                        id={ids.email}
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="field"
                        placeholder="you@example.com"
                        value={values.email}
                        onChange={update("email")}
                        aria-invalid={!!errors.email}
                        aria-describedby={describedBy("email", ids.email)}
                      />
                    </Field>

                    <Field
                      id={ids.dates}
                      label={copy.dates}
                      error={errorText("dates")}
                      hint={copy.datesHint}
                      className="sm:col-span-2"
                    >
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <button
                            id={ids.dates}
                            type="button"
                            className="field flex items-center justify-between gap-3 text-left"
                            aria-invalid={!!errors.dates}
                            aria-describedby={errors.dates ? `${ids.dates}-error` : `${ids.dates}-hint`}
                          >
                            <span className="flex items-center gap-3">
                              <IconCalendarEvent size={19} className="text-gold-400" />
                              <span className={rangeLabel ? "text-ivory" : "text-ivory-muted/80"}>
                                {rangeLabel ?? copy.datesPh}
                              </span>
                            </span>
                            <IconChevronDown
                              size={18}
                              className={cn("text-ivory-muted transition-transform duration-200", calendarOpen && "rotate-180")}
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-auto rounded-[18px] border-gold-400/20 bg-night-800 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                        >
                          <Calendar
                            mode="range"
                            locale={dateLocale}
                            formatters={lang === "kn" ? { formatWeekdayName: (d) => format(d, "EEEEE", { locale: dateLocale }) } : undefined}
                            selected={range}
                            onSelect={onRange}
                            numberOfMonths={twoMonths ? 2 : 1}
                            disabled={{ before: startOfToday() }}
                            startMonth={startOfToday()}
                            className="[--cell-size:2.6rem]"
                          />
                          <div className="flex items-center justify-between gap-4 border-t border-ivory/10 px-3 pb-1 pt-3">
                            <span className="text-sm text-ivory-muted">{rangeLabel ?? copy.noDates}</span>
                            <button
                              type="button"
                              onClick={() => setCalendarOpen(false)}
                              className="rounded-full bg-gold-400 px-4 py-1.5 text-sm font-semibold text-night-950 active:scale-[0.97]"
                            >
                              {copy.done}
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </Field>

                    <fieldset className="flex flex-col gap-3 sm:col-span-2">
                      <legend className="mb-3 text-sm font-semibold text-ivory/90">{copy.occasion}</legend>
                      <div className="flex flex-wrap gap-2">
                        {OCCASIONS.map((o) => {
                          const checked = values.occasion === o;
                          return (
                            <label
                              key={o}
                              className={cn(
                                "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,color] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-400 active:scale-[0.97]",
                                checked
                                  ? "border-gold-400 bg-gold-400/15 text-gold-200"
                                  : "border-ivory/15 text-ivory/75 hover:border-ivory/35 hover:text-ivory"
                              )}
                            >
                              <input
                                type="radio"
                                name="occasion"
                                value={o}
                                checked={checked}
                                onChange={update("occasion")}
                                className="sr-only"
                              />
                              {copy.occasions[o]}
                            </label>
                          );
                        })}
                      </div>
                      <AnimatePresence initial={false}>
                        {values.occasion === "Other" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: EASE_OUT }}
                            className="overflow-hidden"
                          >
                            <Field id={ids.other} label={copy.otherLabel} error={errorText("otherOccasion")} className="pt-2">
                              <input
                                id={ids.other}
                                className="field"
                                placeholder={copy.otherPh}
                                value={values.otherOccasion}
                                onChange={update("otherOccasion")}
                                aria-invalid={!!errors.otherOccasion}
                                aria-describedby={describedBy("otherOccasion", ids.other)}
                              />
                            </Field>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </fieldset>

                    <Field id={ids.notes} label={copy.notes} optional className="sm:col-span-2">
                      <textarea
                        id={ids.notes}
                        rows={3}
                        className="field h-auto resize-y py-3 leading-relaxed"
                        placeholder={copy.notesPh}
                        value={values.notes}
                        onChange={update("notes")}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <button type="submit" disabled={sending} className="btn-gold w-full !h-14 text-base disabled:opacity-70">
                        {sending ? copy.sending : copy.submit}
                        {!sending && <IconArrowRight size={19} stroke={2.2} />}
                      </button>
                      <p className="mt-4 text-center text-[0.82rem] text-ivory-muted">
                        {copy.privacy}
                      </p>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
