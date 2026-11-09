import { Component, lazy, Suspense, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { IconArrowRight } from "@tabler/icons-react";
import DeityImage from "@/assets/deity-cutout.webp";
import LakshmiImage from "@/assets/lakshmi-cutout.webp";
import LampImage from "@/assets/diya-lamp.png";
import { useLang } from "@/i18n/LanguageContext";
import { EASE_OUT, useMediaQuery } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ChakraScene = lazy(() => import("./ChakraScene"));
const PetalShower = lazy(() => import("./ChakraScene").then((m) => ({ default: m.PetalShower })));

// If WebGL is unavailable the hero simply renders without the 3D layers.
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// wick positions on diya-lamp.png (x%, y% of the image), with a flame size relative to the lamp width
const WICKS = [
  { x: 6, y: 89.4, size: 13, delay: "0s" },
  { x: 93.5, y: 89.4, size: 13, delay: "-0.7s" },
  { x: 22, y: 88.6, size: 8, delay: "-1.2s" },
  { x: 79, y: 88.6, size: 8, delay: "-0.35s" },
];
const EMBERS = [
  { x: 6, dx: "-8px", delay: "0s" },
  { x: 93.5, dx: "7px", delay: "-1.4s" },
  { x: 8, dx: "5px", delay: "-2.5s" },
  { x: 91, dx: "-6px", delay: "-3.1s" },
];

// glitter around Lakshmi's seat (x%, y% of her box, size px, delay)
const GLINTS = [
  { x: 4, y: 86, s: 11, d: "0s" },
  { x: 96, y: 85, s: 10, d: "-1.1s" },
  { x: 18, y: 95, s: 8, d: "-0.6s" },
  { x: 82, y: 94, s: 9, d: "-1.9s" },
  { x: 33, y: 99, s: 7, d: "-2.3s" },
  { x: 67, y: 99.5, s: 8, d: "-0.9s" },
  { x: 50, y: 101, s: 10, d: "-1.5s" },
  { x: -3, y: 93, s: 7, d: "-2.6s" },
  { x: 103, y: 92, s: 7, d: "-0.3s" },
  { x: 58, y: 89, s: 6, d: "-2s" },
];

function HangingLamp({ side, delay }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-0 hidden h-[48vh] max-h-[520px] md:block",
        side === "left" ? "left-[2.5%]" : "right-[2.5%]"
      )}
    >
      <div className="motion-safe-loop relative h-full origin-top animate-swing" style={{ animationDelay: delay }}>
        {/* warm light the flames throw into the night, behind the brass */}
        <div className="motion-safe-loop absolute bottom-[-6%] left-1/2 h-[42%] w-[340%] -translate-x-1/2 animate-flicker rounded-full bg-[radial-gradient(closest-side,rgba(255,180,80,0.42),rgba(255,130,40,0.14)_55%,transparent)] blur-xl" />

        <div className="relative h-full">
          <img
            src={LampImage}
            alt=""
            className="h-full w-auto brightness-[1.06] contrast-[1.08] saturate-[1.1] drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
          />
          {/* firelight catching the bowl's rim */}
          <div className="motion-safe-loop absolute bottom-[4%] left-1/2 h-[12%] w-[130%] -translate-x-1/2 animate-flicker rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,236,170,0.5),transparent)] mix-blend-screen blur-[6px]" />

          {WICKS.map((w) => (
            <span
              key={w.x}
              className="lamp-flame"
              style={{ left: `${w.x}%`, top: `${w.y}%`, "--fw": `calc(min(48vh, 520px) * ${(w.size * 168) / 90000})`, animationDelay: w.delay }}
            />
          ))}
          {EMBERS.map((e) => (
            <span
              key={e.delay}
              className="lamp-ember"
              style={{ left: `${e.x}%`, top: "86%", "--dx": e.dx, animationDelay: e.delay }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t, lang } = useLang();
  const heroRef = useRef(null);
  const haloRef = useRef(null);
  const reduce = useReducedMotion();
  const compact = useMediaQuery("(max-width: 767px)");
  const inView = useInView(heroRef, { margin: "0px 0px -5% 0px" });
  const [sceneReady, setSceneReady] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentTransform = useTransform(scrollYProgress, (v) => (reduce ? "none" : `translateY(${v * -80}px)`));
  const deityTransform = useTransform(scrollYProgress, (v) => (reduce ? "none" : `translateY(${v * 60}px)`));

  const item = {
    hidden: { opacity: 0, transform: reduce ? "none" : "translateY(22px)" },
    show: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.95, ease: EASE_OUT } },
  };

  return (
    <section id="home" ref={heroRef} className="relative isolate overflow-hidden bg-night-950">
      {/* night sky */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(110%_75%_at_68%_25%,#2c2266_0%,#130f30_45%,#08071a_100%)]" />
        <div className="absolute -left-40 -top-24 h-[44vh] w-[44vh] rounded-full bg-[#5b3fd6]/12 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-night-950" />
      </div>

      <SceneBoundary>
        <Suspense fallback={null}>
          <div aria-hidden className="absolute inset-0 -z-10 transition-opacity duration-[1600ms]" style={{ opacity: sceneReady ? 1 : 0 }}>
            <ChakraScene
              anchorRef={haloRef}
              eventSource={heroRef}
              progress={scrollYProgress}
              active={inView}
              still={reduce}
              compact={compact}
              onReady={() => setSceneReady(true)}
            />
          </div>
        </Suspense>
      </SceneBoundary>

      <HangingLamp side="left" delay="0s" />
      <HangingLamp side="right" delay="-4.5s" />

      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-4 md:px-8 lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-end lg:gap-6">
        <motion.div
          style={{ opacity: contentOpacity, transform: contentTransform }}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } } }}
          className="relative z-20 pb-14 pt-6 text-center lg:self-center lg:pb-0 lg:pl-[clamp(0px,6vw,96px)] lg:pt-16 lg:text-left"
        >
          <motion.p variants={item} className="flex items-center justify-center gap-3 lg:justify-start">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-400" />
            <span lang="kn" translate="no" className="font-kannada-serif text-[1.08rem] font-semibold text-gold-300">
              {t.invocation}
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold-400 lg:hidden" />
          </motion.p>

          <motion.h1
            variants={item}
            className={cn(
              "mx-auto mt-6 font-display font-medium text-ivory lg:mx-0",
              lang === "kn"
                ? "max-w-[16ch] text-[2.3rem] leading-[1.3] sm:text-5xl lg:text-[3.3rem]"
                : "max-w-[14ch] text-[2.9rem] leading-[1.04] tracking-[-0.01em] sm:text-6xl xl:text-[4.5rem]"
            )}
          >
            {t.hero.titleBefore}
            <em className="font-semibold text-gold-300">{t.hero.titleEm}</em>
            {t.hero.titleAfter}
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-[44ch] text-[1.06rem] leading-relaxed text-ivory-muted md:text-lg lg:mx-0"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <a href="#enquire" className="btn-gold">
              {t.cta.enquire}
              <IconArrowRight size={18} stroke={2.2} />
            </a>
            <a href="#gallery" className="btn-ghost">
              {t.cta.gallery}
            </a>
          </motion.div>
        </motion.div>

        {/* The Lord, standing on a pool of light with the chakra glowing behind His head,
            and Lakshmi Devi seated on her lotus at His feet */}
        <motion.div style={{ transform: deityTransform }} className="relative order-first flex justify-center pt-[5.75rem] lg:order-none lg:pt-0">
          {/* on lg the height is also capped by viewport width so the deity never meets the text */}
          <div className="relative aspect-[900/1930] h-[min(52svh,520px)] md:h-[min(62svh,680px)] lg:h-[min(86svh,920px,calc(100vw-260px))]">
            {/* Lakshmi: seated on her lotus just above His feet (which stay visible below her) */}
            <div className="absolute bottom-[7.5%] left-1/2 z-20 aspect-[900/1394] h-[44%] -translate-x-1/2">
              <div aria-hidden className="absolute left-1/2 top-[22%] aspect-square w-[105%] -translate-x-1/2 -translate-y-1/2">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,0.55),rgba(240,120,160,0.18)_55%,transparent)] blur-md" />
                <div className="motion-safe-loop absolute inset-[-8%] animate-[spin_70s_linear_infinite] rounded-full bg-[repeating-conic-gradient(rgba(255,220,150,0.38)_0deg_2deg,transparent_2deg_10deg)] [mask-image:radial-gradient(closest-side,transparent_28%,black_45%,transparent_100%)]" />
              </div>
              {/* golden mist where her seat meets His legs, so the two images melt together */}
              <div aria-hidden className="absolute bottom-[-1%] left-1/2 h-[26%] w-[128%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,214,140,0.62),rgba(240,160,70,0.3)_50%,rgba(150,90,200,0.08)_75%,transparent)] blur-xl" />
              <div aria-hidden className="motion-safe-loop absolute bottom-[3%] left-1/2 h-[9%] w-[112%] -translate-x-1/2 animate-flicker rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,236,180,0.55),transparent)] blur-md" />
              <motion.img
                src={LakshmiImage}
                alt={t.hero.lakshmiAlt}
                width={900}
                height={1394}
                initial={{ opacity: 0, transform: reduce ? "none" : "translateY(30px) scale(0.97)" }}
                animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.35 }}
                className="relative h-full w-full object-contain drop-shadow-[0_0_22px_rgba(255,200,110,0.35)] [mask-image:linear-gradient(to_bottom,black_93%,rgba(0,0,0,0.45)_98%)]"
              />
              {/* glitter twinkling around the golden seat */}
              {GLINTS.map((g) => (
                <span
                  key={g.x + "-" + g.y}
                  aria-hidden
                  className="glint z-10"
                  style={{ left: `${g.x}%`, top: `${g.y}%`, "--gs": `${g.s}px`, animationDelay: g.d }}
                />
              ))}
            </div>

            {/* halo anchor: centred on His centre line (crown tip and namam sit at 49.5% of the image width) */}
            <div ref={haloRef} aria-hidden className="absolute left-[-1.5%] top-[-8.4%] h-[47.5%] w-[102%]" />

            <div aria-hidden className="absolute left-1/2 top-[8%] h-[70%] w-[150%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,170,80,0.28),rgba(120,80,200,0.12)_55%,transparent)] blur-2xl" />
            <div aria-hidden className="absolute -bottom-2 left-1/2 h-16 w-[130%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,196,110,0.55),rgba(255,160,60,0.18)_55%,transparent)] blur-md" />

            <motion.img
              src={DeityImage}
              alt={t.hero.deityAlt}
              width={900}
              height={1930}
              fetchPriority="high"
              initial={{ opacity: 0, transform: reduce ? "none" : "translateY(40px) scale(0.97)" }}
              animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
              transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.1 }}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_30px_60px_rgba(8,7,26,0.7)]"
            />
          </div>
        </motion.div>
      </div>

      {/* flower shower in front of the deity */}
      {!reduce && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
              <PetalShower active={inView} still={reduce} compact={compact} />
            </div>
          </Suspense>
        </SceneBoundary>
      )}
    </section>
  );
}
