import { IconArrowUpRight, IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";
import Building from "@/assets/gallery/3-sm.webp";
import ChakraMark from "@/assets/chakra-mark.png";
import Reveal from "./Reveal";
import { NAV, SITE } from "@/lib/site";
import { useLang } from "@/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLang();
  const contacts = [
    SITE.phone && {
      icon: IconPhone,
      label: SITE.phone,
      note: t.footer.contactName,
      href: `tel:${SITE.phone.replace(/\s/g, "")}`,
    },
    SITE.email && { icon: IconMail, label: SITE.email, href: `mailto:${SITE.email}` },
    { icon: IconMapPin, label: t.footer.address, note: SITE.mapsUrl && t.footer.directions, href: SITE.mapsUrl || undefined },
  ].filter(Boolean);

  return (
    <footer id="contact" className="relative bg-night-900">
      <div className="gold-rule" />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-20 md:px-8 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p lang="kn" translate="no" className="font-kannada-serif text-lg font-semibold text-gold-300">
              {t.invocation}
            </p>
            <h2 className="mt-5 max-w-[20ch] font-display text-4xl font-medium leading-[1.08] text-ivory md:text-5xl">
              {t.footer.title}
            </h2>

            {contacts.length > 0 ? (
              <ul className="mt-9 flex flex-col gap-4">
                {contacts.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      className="group inline-flex max-w-[44ch] items-start gap-4 text-lg leading-snug text-ivory/90 hover:text-ivory"
                      {...(c.href?.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 text-gold-300">
                        <c.icon size={20} stroke={1.6} />
                      </span>
                      <span className="pt-2">
                        <span className="block">{c.label}</span>
                        {c.note && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[0.95rem] font-semibold text-gold-300">
                            {c.note}
                            {c.href?.startsWith("http") && <IconArrowUpRight size={16} />}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ivory-muted">
                {t.footer.fallback}
              </p>
            )}

            <a href="#enquire" className="btn-gold mt-10">
              {t.cta.enquire}
            </a>
          </Reveal>

          <Reveal delay={0.1} as="figure">
            <div className="overflow-hidden rounded-[22px] ring-1 ring-gold-400/15">
              <img src={Building} alt={t.footer.buildingAlt} loading="lazy" className="aspect-[1280/576] w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-ivory-muted">{t.footer.buildingCaption}</figcaption>
          </Reveal>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-ivory/10 pt-8 md:flex-row">
          <a href="#home" className="flex items-center gap-3">
            <img src={ChakraMark} alt="" className="h-9 w-auto" />
            <span className="font-display text-xl font-semibold text-ivory">
              {t.brand.name} <span className="text-gold-300">{t.brand.tagline}</span>
            </span>
          </a>
          <nav aria-label={t.footer.navLabel} className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-ivory/70">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-ivory">
                {t.nav[n.key]}
              </a>
            ))}
          </nav>
          <p className="text-sm text-ivory/50">
            © {new Date().getFullYear()} {t.brand.full}
          </p>
        </div>
      </div>
    </footer>
  );
}
