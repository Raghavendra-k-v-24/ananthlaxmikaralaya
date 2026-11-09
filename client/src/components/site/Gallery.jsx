import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import Reveal from "./Reveal";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageContext";

const FULL = import.meta.glob("../../assets/gallery/*[0-9].webp", { eager: true, import: "default" });
const THUMB = import.meta.glob("../../assets/gallery/*-sm.webp", { eager: true, import: "default" });

const PHOTOS = [
  { n: 13, cat: "Hall" },
  { n: 5, cat: "Stage" },
  { n: 3, cat: "Venue" },
  { n: 2, cat: "Hall" },
  { n: 8, cat: "Seating" },
  { n: 10, cat: "Stage" },
  { n: 18, cat: "Hall" },
  { n: 1, cat: "Venue" },
  { n: 23, cat: "Hall" },
  { n: 9, cat: "Seating" },
  { n: 15, cat: "Venue" },
  { n: 6, cat: "Hall" },
  { n: 11, cat: "Hall" },
  { n: 19, cat: "Hall" },
  { n: 7, cat: "Seating" },
  { n: 14, cat: "Hall" },
  { n: 4, cat: "Hall" },
  { n: 20, cat: "Hall" },
  { n: 16, cat: "Venue" },
  { n: 22, cat: "Hall" },
  { n: 17, cat: "Venue" },
  { n: 24, cat: "Hall" },
  { n: 25, cat: "Hall" },
  { n: 21, cat: "Venue" },
].map((p) => ({
  ...p,
  full: FULL[`../../assets/gallery/${p.n}.webp`],
  thumb: THUMB[`../../assets/gallery/${p.n}-sm.webp`],
  ratio: p.n === 1 ? "4 / 3" : p.n === 3 ? "1280 / 576" : "1280 / 852",
}));

const FILTERS = ["All", "Hall", "Stage", "Seating", "Venue"];
const INITIAL = 9;

function Lightbox({ photos, index, onClose, onStep }) {
  const { t } = useLang();
  const closeRef = useRef(null);
  const reduce = useReducedMotion();
  const photo = photos[index];

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t.gallery.viewer}
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/92 p-4 backdrop-blur-md md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      onClick={onClose}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.figure
          key={photo.n}
          initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.97)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="flex max-h-full max-w-6xl flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={photo.full} alt={t.photos[photo.n]} className="max-h-[78vh] w-auto rounded-[18px] object-contain shadow-2xl" />
          <figcaption className="mt-4 text-center text-sm text-ivory-muted">
            {t.photos[photo.n]}
            <span className="ml-3 text-ivory/45">{t.gallery.count(index + 1, photos.length)}</span>
          </figcaption>
        </motion.figure>
      </AnimatePresence>

      <button ref={closeRef} type="button" onClick={onClose} aria-label={t.gallery.close} className="absolute right-4 top-4 inline-flex size-12 items-center justify-center rounded-full border border-ivory/15 bg-night-800/80 text-ivory md:right-8 md:top-8">
        <IconX size={20} />
      </button>
      <button type="button" onClick={(e) => (e.stopPropagation(), onStep(-1))} aria-label={t.gallery.prev} className="absolute left-3 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/15 bg-night-800/80 text-ivory md:left-8">
        <IconChevronLeft size={22} />
      </button>
      <button type="button" onClick={(e) => (e.stopPropagation(), onStep(1))} aria-label={t.gallery.next} className="absolute right-3 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/15 bg-night-800/80 text-ivory md:right-8">
        <IconChevronRight size={22} />
      </button>
    </motion.div>
  );
}

export default function Gallery() {
  const { t } = useLang();
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const reduce = useReducedMotion();

  const filtered = useMemo(
    () => (filter === "All" ? PHOTOS : PHOTOS.filter((p) => p.cat === filter)),
    [filter]
  );
  const visible = expanded ? filtered : filtered.slice(0, INITIAL);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir) => setOpenIndex((i) => (i + dir + filtered.length) % filtered.length),
    [filtered.length]
  );

  return (
    <section id="gallery" className="relative bg-night-950 py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#3b2f8f]/15 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="flex flex-col items-center text-center">
          <h2 className="font-display text-4xl font-medium leading-[1.08] text-ivory md:text-[3.4rem]">
            {t.gallery.title}
          </h2>
          <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-ivory-muted">
            {t.gallery.sub}
          </p>

          <div role="tablist" aria-label={t.gallery.filterLabel} className="mt-9 flex max-w-full gap-1 overflow-x-auto rounded-full border border-gold-400/15 bg-night-800/60 p-1.5 [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => {
                  setFilter(f);
                  setExpanded(false);
                }}
                className={cn(
                  "relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
                  filter === f ? "text-night-950" : "text-ivory/75 hover:text-ivory"
                )}
              >
                {filter === f && (
                  <motion.span
                    layoutId="gallery-filter"
                    className="absolute inset-0 -z-0 rounded-full bg-gradient-to-b from-gold-300 to-gold-500"
                    transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
                  />
                )}
                <span className="relative">{t.gallery.filters[f]}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <motion.ul
          key={filter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4"
        >
          {visible.map((photo, i) => (
            <motion.li
              key={photo.n}
              initial={{ opacity: 0, transform: reduce ? "none" : "translateY(16px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: (i % 3) * 0.06 }}
              className="break-inside-avoid"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group relative block w-full overflow-hidden rounded-[20px] ring-1 ring-gold-400/10 transition-[box-shadow] duration-300 hover:ring-gold-400/40"
                aria-label={t.gallery.open(t.photos[photo.n])}
              >
                <img
                  src={photo.thumb}
                  alt=""
                  loading="lazy"
                  style={{ aspectRatio: photo.ratio }}
                  className="w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out-strong)] [@media(hover:hover)]:group-hover:scale-[1.05]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-night-950/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </motion.li>
          ))}
        </motion.ul>

        {filtered.length > INITIAL && (
          <div className="mt-10 flex justify-center">
            <button type="button" className="btn-ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? t.gallery.showFewer : t.gallery.showAll(filtered.length)}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox photos={filtered} index={openIndex} onClose={close} onStep={step} />
        )}
      </AnimatePresence>
    </section>
  );
}
