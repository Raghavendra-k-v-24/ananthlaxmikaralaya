import MainHall from "@/assets/gallery/11.webp";
import Stage from "@/assets/gallery/10-sm.webp";
import Balcony from "@/assets/gallery/14-sm.webp";
import LowerHall from "@/assets/gallery/15.webp";
import { IconBolt, IconDoor, IconSparkles, IconToolsKitchen2 } from "@tabler/icons-react";
import Reveal from "./Reveal";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageContext";

// Descriptions inferred from photos; copy lives in src/i18n/strings.jsx
const AMENITY_ICONS = [IconDoor, IconBolt, IconToolsKitchen2, IconSparkles];

const SPACES = [
  { key: "main", src: MainHall, className: "md:col-span-4 md:row-span-2 min-h-[22rem] md:min-h-[34rem]" },
  { key: "stage", src: Stage, className: "md:col-span-2 min-h-[16rem]" },
  { key: "balcony", src: Balcony, className: "md:col-span-2 min-h-[16rem]" },
];

function SpaceTile({ space, delay }) {
  const { t } = useLang();
  const copy = t.hall[space.key];
  return (
    <Reveal
      delay={delay}
      className={cn(
        "group relative isolate flex overflow-hidden rounded-[22px] ring-1 ring-gold-400/15",
        space.className
      )}
    >
      <img
        src={space.src}
        alt={copy.alt}
        loading="lazy"
        className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-strong)] [@media(hover:hover)]:group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950/95 via-night-950/30 to-transparent" />
      <div className="mt-auto p-6 md:p-7">
        <h3 className="font-display text-[1.75rem] font-semibold leading-tight text-ivory">{copy.title}</h3>
        <p className="mt-1.5 max-w-[42ch] text-[0.95rem] leading-relaxed text-ivory/80">{copy.body}</p>
      </div>
    </Reveal>
  );
}

export default function Hall() {
  const { t } = useLang();
  return (
    <section id="about" className="relative bg-night-950 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal className="max-w-3xl">
          <h2 className="font-display text-4xl font-medium leading-[1.08] text-ivory md:text-[3.4rem]">
            {t.hall.title}
          </h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ivory-muted">
            {t.hall.body}
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.hall.amenities.map((a, i) => {
            const Icon = AMENITY_ICONS[i];
            return (
              <Reveal
                as="li"
                key={a.title}
                delay={i * 0.06}
                className="flex gap-4 rounded-[20px] bg-night-800/60 p-5 ring-1 ring-gold-400/15"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-night-900 text-gold-300">
                  <Icon size={21} stroke={1.6} />
                </span>
                <div>
                  <h3 className="font-semibold leading-snug text-ivory">{a.title}</h3>
                  <p className="mt-1 text-[0.93rem] leading-relaxed text-ivory-muted">{a.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <div className="mt-6 grid auto-rows-auto grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          {SPACES.map((space, i) => (
            <SpaceTile key={space.key} space={space} delay={i * 0.08} />
          ))}

          {/* wide closing row: copy on the left, photo on the right */}
          <Reveal
            delay={0.12}
            className="grid overflow-hidden rounded-[22px] bg-night-800/70 ring-1 ring-gold-400/15 md:col-span-6 md:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="flex flex-col justify-center p-7 md:p-12">
              <h3 className="font-display text-[2rem] font-semibold leading-tight text-ivory">{t.hall.lower.title}</h3>
              <p className="mt-3 max-w-[44ch] text-[1.02rem] leading-relaxed text-ivory-muted">
                {t.hall.lower.body}
              </p>
              <a href="#gallery" className="mt-7 inline-flex w-fit items-center gap-2 text-[0.95rem] font-semibold text-gold-300 underline-offset-[6px] hover:underline">
                {t.hall.lower.more}
              </a>
            </div>
            <div className="group relative min-h-[16rem] overflow-hidden md:min-h-[20rem]">
              <img
                src={LowerHall}
                alt={t.hall.lower.alt}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-strong)] [@media(hover:hover)]:group-hover:scale-[1.04]"
              />
              <div className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-night-800/90 to-transparent md:block" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
