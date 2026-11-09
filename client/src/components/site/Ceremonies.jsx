import ChakraMark from "@/assets/chakra-mark.png";
import { useLang } from "@/i18n/LanguageContext";

function Row({ items, hidden }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((name) => (
        <li key={name} className="flex items-center">
          <span className="whitespace-nowrap px-7 font-display text-[2rem] italic leading-[1.35] text-ivory/90 md:px-10 md:text-[2.6rem]">
            {name}
          </span>
          <img src={ChakraMark} alt="" className="h-6 w-auto opacity-80 md:h-7" />
        </li>
      ))}
    </ul>
  );
}

export default function Ceremonies() {
  const { t } = useLang();
  const items = t.ceremonies.list;
  return (
    <section aria-label={t.ceremonies.label} className="relative overflow-hidden border-y border-gold-400/15 bg-night-900 py-9 md:py-11">
      <div className="group flex w-max motion-safe-loop animate-marquee [@media(hover:hover)]:hover:[animation-play-state:paused]">
        <Row items={items} />
        <Row items={items} hidden />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-night-900 to-transparent md:w-48" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-night-900 to-transparent md:w-48" />
    </section>
  );
}
