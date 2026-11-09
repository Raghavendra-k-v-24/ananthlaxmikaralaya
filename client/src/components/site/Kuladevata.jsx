import HanumanImage from "@/assets/hanuman.webp";
import Reveal from "./Reveal";
import { useLang } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

// The owner's family deity, Sri Anjaneya Swamy, shown large in a gilded shrine frame.
export default function Kuladevata() {
  const { t, lang } = useLang();
  const copy = t.kuladevata;
  return (
    <section id="kuladevata" className="relative isolate overflow-hidden bg-night-950 py-20 md:py-28">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[80%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,170,80,0.14),rgba(120,80,200,0.08)_60%,transparent)] blur-2xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-16 md:px-8">
        {/* the shrine */}
        <Reveal className="relative mx-auto w-full max-w-[min(30rem,100%)]">
          {/* slow rays behind the frame */}
          <div
            aria-hidden
            className="motion-safe-loop absolute left-1/2 top-[42%] -z-10 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 animate-[spin_90s_linear_infinite] rounded-full bg-[repeating-conic-gradient(rgba(255,214,140,0.16)_0deg_2deg,transparent_2deg_9deg)] [mask-image:radial-gradient(closest-side,transparent_35%,black_55%,transparent_100%)]"
          />
          <div aria-hidden className="absolute inset-[-6%] -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgba(255,196,110,0.32),transparent)] blur-2xl" />

          <figure className="rounded-[26px] bg-gradient-to-b from-gold-300 via-gold-500 to-[#8a5a1c] p-[3px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="rounded-[23px] bg-night-950 p-2.5">
              <img
                src={HanumanImage}
                alt={copy.alt}
                width={900}
                height={1228}
                loading="lazy"
                className="block h-auto w-full rounded-[16px]"
              />
            </div>
          </figure>
          {/* lamp-light pool beneath the shrine */}
          <div aria-hidden className="motion-safe-loop absolute -bottom-6 left-1/2 h-14 w-[90%] -translate-x-1/2 animate-flicker rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,190,100,0.45),transparent)] blur-lg" />
        </Reveal>

        {/* the words */}
        <Reveal delay={0.1} className="text-center md:text-left">
          <p className="flex items-center justify-center gap-3 md:justify-start">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-400" />
            <span lang="kn" translate="no" className="font-kannada-serif text-[1.08rem] font-semibold text-gold-300">
              {copy.invocation}
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold-400 md:hidden" />
          </p>
          <p
            className={cn(
              "mt-6 font-semibold text-gold-400",
              lang === "kn" ? "text-[0.95rem]" : "text-[0.78rem] uppercase tracking-[0.22em]"
            )}
          >
            {copy.label}
          </p>
          <h2
            className={cn(
              "mx-auto mt-3 font-display font-medium text-ivory md:mx-0",
              lang === "kn"
                ? "max-w-[18ch] text-[2.1rem] leading-[1.35] md:text-[2.8rem]"
                : "max-w-[16ch] text-4xl leading-[1.08] md:text-[3.4rem]"
            )}
          >
            {copy.title}
          </h2>
          <p className="mx-auto mt-6 max-w-[48ch] text-lg leading-relaxed text-ivory-muted md:mx-0">{copy.body}</p>
        </Reveal>
      </div>
    </section>
  );
}
