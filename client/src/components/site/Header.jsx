import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { IconArrowRight, IconMenu2, IconX } from "@tabler/icons-react";
import ChakraImage from "@/assets/chakra-mark.png";
import { NAV } from "@/lib/site";
import { useLang } from "@/i18n/LanguageContext";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

// "enquire" has no nav link; observing it clears the highlight on the form
const SECTION_IDS = [...NAV.map((n) => n.href.slice(1)), "enquire"];

function LanguageSwitch({ className }) {
  const { lang, setLang, t } = useLang();
  const reduce = useReducedMotion();
  const options = [
    { value: "en", label: "EN" },
    { value: "kn", label: "ಕನ್ನಡ" },
  ];
  // The pill is positioned from the buttons' offsets inside the switch, so it is unaffected
  // by page scroll or the fixed header (a shared-layout animation measured against the page).
  const buttonRefs = useRef({});
  const [pill, setPill] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = buttonRefs.current[lang];
      if (el) setPill({ x: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    // fonts loading in later can change the button widths
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [lang]);

  return (
    <div
      role="radiogroup"
      aria-label={t.a11y.language}
      translate="no"
      className={cn("relative flex items-center rounded-full border border-gold-400/25 bg-night-900/60 p-1", className)}
    >
      {/* always rendered (hidden until measured) so no node is ever inserted into the switch */}
      <motion.span
        aria-hidden
        initial={false}
        animate={pill ? { x: pill.x, width: pill.width, opacity: 1 } : { opacity: 0 }}
        transition={reduce || !pill ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.35 }}
        className="absolute inset-y-1 left-0 rounded-full bg-gradient-to-b from-gold-300 to-gold-500"
      />
      {options.map((o) => {
        const checked = lang === o.value;
        return (
          <button
            key={o.value}
            ref={(el) => (buttonRefs.current[o.value] = el)}
            type="button"
            role="radio"
            aria-checked={checked}
            lang={o.value}
            translate="no"
            onClick={() => setLang(o.value)}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-[0.8rem] font-semibold transition-colors duration-200",
              checked ? "text-night-950" : "text-ivory/70 hover:text-ivory"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Header() {
  const { t, lang } = useLang();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const active = useActiveSection(SECTION_IDS);

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 24;
    if (next !== scrolled) setScrolled(next);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // layoutRoot: layout animations inside this fixed header are measured relative to it, not the scrolled page
    <motion.header layoutRoot className="fixed inset-x-0 top-0 z-40">
      <div
        className={cn(
          "border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled || open ? "border-gold-400/15 bg-night-950/75 backdrop-blur-xl" : "border-transparent bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <a href="#home" className="flex min-w-0 items-center gap-2.5" aria-label={t.a11y.home}>
            <img src={ChakraImage} alt="" className="h-11 w-auto shrink-0 drop-shadow-[0_4px_14px_rgba(217,166,72,0.35)]" />
            <span translate="no" className="flex min-w-0 flex-col leading-none">
              <span
                className={cn(
                  "truncate font-display font-semibold tracking-tight text-ivory",
                  lang === "kn" ? "text-[1.15rem] leading-tight" : "text-[1.45rem]"
                )}
              >
                {t.brand.name}
              </span>
              <span
                className={cn(
                  "mt-1 truncate font-semibold text-gold-400",
                  lang === "kn" ? "text-[0.74rem]" : "text-[0.68rem] uppercase tracking-[0.22em]"
                )}
              >
                {t.brand.tagline}
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const isActive = active === item.href.slice(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative whitespace-nowrap rounded-full px-4 py-2 text-[0.93rem] font-medium transition-colors duration-200",
                    isActive ? "text-ivory" : "text-ivory/70 hover:text-ivory"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-gold-400/12 ring-1 ring-gold-400/25"
                      transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.45 }}
                    />
                  )}
                  {t.nav[item.key]}
                </a>
              );
            })}
            <LanguageSwitch className="ml-3" />
            <a href="#enquire" className="btn-gold ml-3 !h-11 !px-5 text-[0.9rem]">
              {t.cta.enquire}
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitch />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-gold-400/25 text-ivory"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
            >
              {open ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, transform: "translateY(-12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: "translateY(-12px)" }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="border-b border-gold-400/15 bg-night-950/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="mx-auto flex max-w-7xl flex-col px-4 pb-6 pt-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-ivory/8 py-4 font-display text-2xl text-ivory"
                  >
                    {t.nav[item.key]}
                    <IconArrowRight size={18} className="text-gold-400" />
                  </a>
                </li>
              ))}
              <li className="pt-5">
                <a href="#enquire" onClick={() => setOpen(false)} className="btn-gold w-full">
                  {t.cta.enquire}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
