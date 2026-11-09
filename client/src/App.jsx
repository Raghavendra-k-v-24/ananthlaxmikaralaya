import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/manrope";
import "@fontsource/noto-sans-kannada/kannada-400.css";
import "@fontsource/noto-sans-kannada/kannada-600.css";
import "@fontsource/noto-serif-kannada/kannada-500.css";
import "@fontsource/noto-serif-kannada/kannada-600.css";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { LanguageProvider, useLang } from "./i18n/LanguageContext";
import Header from "./components/site/Header";
import Hero from "./components/site/Hero";
import Kuladevata from "./components/site/Kuladevata";
import Hall from "./components/site/Hall";
import Ceremonies from "./components/site/Ceremonies";
import Gallery from "./components/site/Gallery";
import Booking from "./components/site/Booking";
import Footer from "./components/site/Footer";

function Page() {
  const { t } = useLang();
  return (
    <div className="min-h-screen overflow-x-clip bg-night-950 text-ivory">
      <a
        href="#enquire"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-night-950"
      >
        {t.a11y.skip}
      </a>
      <Header />
      <main>
        <Hero />
        <Kuladevata />
        <Hall />
        <Ceremonies />
        <Gallery />
        <Booking />
      </main>
      <Footer />
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "#161333",
            border: "1px solid rgba(232,192,116,0.25)",
            color: "#f7f0e3",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </div>
  );
}

const App = () => (
  <MotionConfig reducedMotion="user">
    <LanguageProvider>
      <Page />
    </LanguageProvider>
  </MotionConfig>
);

export default App;
