"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BeaconAlertFlow } from "../site/BeaconAlertFlow";

const sectionTabs = [
  { id: "overview", label: "Overview" },
  { id: "technology", label: "In Action" },
  { id: "mission", label: "Mission" },
  { id: "trust", label: "Ecosystem" },
  { id: "testimonials", label: "Voices" }
];

const signalStates = ["Tap detected", "Signal encrypted", "Alert delivered"];

const ecosystemLogos = [
  { name: "World Health Organization", src: "https://cdn.simpleicons.org/worldhealthorganization/000000" },
  { name: "Ring", src: "https://cdn.simpleicons.org/ring/000000" },
  { name: "Signal", src: "https://cdn.simpleicons.org/signal/000000" },
  { name: "WhatsApp", src: "https://cdn.simpleicons.org/whatsapp/000000" },
  { name: "Telegram", src: "https://cdn.simpleicons.org/telegram/000000" },
  { name: "Waze", src: "https://cdn.simpleicons.org/waze/000000" },
  { name: "Google Maps", src: "https://cdn.simpleicons.org/googlemaps/000000" },
  { name: "OpenStreetMap", src: "https://cdn.simpleicons.org/openstreetmap/000000" },
  { name: "Mapbox", src: "https://cdn.simpleicons.org/mapbox/000000" },
  { name: "Verizon", src: "https://cdn.simpleicons.org/verizon/000000" },
  { name: "AT&T", src: "https://cdn.simpleicons.org/atandt/000000" },
  { name: "Nokia", src: "https://cdn.simpleicons.org/nokia/000000" },
  { name: "Motorola", src: "https://cdn.simpleicons.org/motorola/000000" },
  { name: "Samsung", src: "https://cdn.simpleicons.org/samsung/000000" },
  { name: "Apple", src: "https://cdn.simpleicons.org/apple/000000" },
  { name: "Android", src: "https://cdn.simpleicons.org/android/000000" },
  { name: "Garmin", src: "https://cdn.simpleicons.org/garmin/000000" },
  { name: "Bosch", src: "https://cdn.simpleicons.org/bosch/000000" },
  { name: "Cisco", src: "https://cdn.simpleicons.org/cisco/000000" },
  { name: "Cloudflare", src: "https://cdn.simpleicons.org/cloudflare/000000" },
  { name: "Qualcomm", src: "https://cdn.simpleicons.org/qualcomm/000000" },
  { name: "Intel", src: "https://cdn.simpleicons.org/intel/000000" },
  { name: "Huawei", src: "https://cdn.simpleicons.org/huawei/000000" },
  { name: "Lyft", src: "https://cdn.simpleicons.org/lyft/000000" }
];

const missionCards = [
  "Safety devices should work in seconds, not menus.",
  "Emergency signaling should be understandable under stress.",
  "Protection should fit into everyday movement."
];

const testimonials = [
  {
    quote: "This is the kind of product that should exist everywhere.",
    author: "Beta User"
  },
  {
    quote: "Simple, fast, and actually useful in real situations.",
    author: "Early Tester"
  },
  {
    quote: "Feels like something that could genuinely save lives.",
    author: "Community Member"
  },
  {
    quote: "One press and my contacts were informed immediately.",
    author: "Pilot User"
  },
  {
    quote: "The flow is instant and easy under pressure.",
    author: "Student Tester"
  },
  {
    quote: "It feels dependable when timing is critical.",
    author: "Runner"
  },
  {
    quote: "Setup was quick and the alerts were clear.",
    author: "Parent"
  },
  {
    quote: "The device is small but the impact is huge.",
    author: "Commuter"
  },
  {
    quote: "I trust how fast it sends location and status.",
    author: "Volunteer"
  },
  {
    quote: "This should be standard for personal safety.",
    author: "Campus Lead"
  },
  {
    quote: "The emergency notification appears right away.",
    author: "Contact Recipient"
  },
  {
    quote: "No confusion, just one action and it works.",
    author: "Field Tester"
  },
  {
    quote: "It stays discreet until the moment it is needed.",
    author: "Night Shift Worker"
  },
  {
    quote: "The delivery status gives real confidence.",
    author: "Community Advisor"
  },
  {
    quote: "The response chain is easy to understand.",
    author: "Safety Trainer"
  },
  {
    quote: "It feels built for real incidents, not demos.",
    author: "Program Mentor"
  },
  {
    quote: "Alerts reached both phone and app without delay.",
    author: "Beta Contact"
  },
  {
    quote: "Minimal design, serious function, zero clutter.",
    author: "Design Reviewer"
  }
];

function RightRailTabs({ activeSection }: { activeSection: string }) {
  return (
    <div className="pointer-events-none fixed right-7 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-black/10 bg-white/86 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.13)] backdrop-blur-xl">
        {sectionTabs.map((tab) => {
          const isActive = activeSection === tab.id;

          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={`rounded-xl px-3 py-2 text-xs transition ${
                isActive ? "bg-black text-white" : "text-black/62 hover:bg-black/[0.06] hover:text-black"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function BeaconVisual() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [34, -22]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [12, -8]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [2, -4]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[660px]">
      <motion.div
        style={{ y, rotateY, rotateX }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative mx-auto h-[290px] w-[92%] rounded-[2.4rem] border border-black/15 bg-gradient-to-br from-neutral-900 via-black to-neutral-800 shadow-[0_50px_120px_rgba(0,0,0,0.42)] sm:h-[360px]"
      >
        <div className="absolute inset-x-8 top-7 h-[35%] rounded-[1.5rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        <div className="absolute left-[15%] top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 shadow-[inset_0_0_30px_rgba(255,255,255,0.12)] sm:h-16 sm:w-16" />
        <div className="absolute right-[15%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white/32 sm:h-4 sm:w-4" />
      </motion.div>
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [8, -10]) }}
        className="pointer-events-none absolute -right-2 top-8 rounded-full border border-black/10 bg-white/92 px-4 py-2 text-[11px] tracking-[0.2em] text-black/55 sm:right-2"
      >
        PORTABLE RESPONSE
      </motion.div>
    </div>
  );
}

export function HomeMarketingPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [activeSignal, setActiveSignal] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSignal((current) => (current + 1) % signalStates.length);
    }, 2100);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionTabs.forEach((tab) => {
      const target = document.getElementById(tab.id);
      if (!target) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(tab.id);
            }
          });
        },
        {
          threshold: 0.5,
          rootMargin: "-20% 0px -40% 0px"
        }
      );

      observer.observe(target);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <div className="relative">
      <RightRailTabs activeSection={activeSection} />

      <section id="overview" className="border-b border-black/10">
        <div className="mx-auto grid min-h-[calc(100vh-130px)] w-full max-w-7xl items-center gap-14 px-6 pb-16 pt-14 lg:grid-cols-[0.96fr_1.04fr] lg:px-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="text-[11px] tracking-[0.28em] text-black/45"
            >
              PERSONAL SAFETY DEVICE
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.06 }}
              className="mt-4 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl"
            >
              Instant response,
              <br />
              without hesitation.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.14 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-black/64 sm:text-lg"
            >
              BEACON is engineered for moments where speed matters most, with one-action triggering and immediate contact notification.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href="/buy-now" className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/85">
                Buy Now
              </Link>
              <a href="#technology" className="rounded-full border border-black/20 px-6 py-3 text-sm font-medium transition hover:bg-black hover:text-white">
                See It In Action
              </a>
            </motion.div>

            <div className="mt-8 h-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={signalStates[activeSignal]}
                  initial={{ opacity: 0, y: 10, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.28 }}
                  className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-sm tracking-tight text-black/72 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  {signalStates[activeSignal]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.18 }}>
            <BeaconVisual />
          </motion.div>
        </div>
      </section>

      <BeaconAlertFlow />

      <section id="mission" className="border-b border-black/10 bg-black py-20 text-white sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
          <p className="text-[11px] tracking-[0.28em] text-white/56">MISSION</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl">
            Safety technology should disappear into your routine until you need it.
          </h2>

          <div className="mt-9 overflow-hidden rounded-2xl border border-white/15 bg-white/5 py-3">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 18, ease: "linear", repeat: Infinity }}
              className="flex w-max items-center gap-3 whitespace-nowrap"
            >
              {new Array(2).fill(missionCards).flat().map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/82">
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section id="trust" className="border-b border-black/10 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
          <h2 className="text-center text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Ecosystem and organizations connected to modern safety response</h2>
          <p className="mx-auto mt-5 max-w-3xl text-center text-base text-black/63 sm:text-lg">
            BEACON operates in a landscape that spans emergency health guidance, communications, mapping, mobility, and hardware infrastructure.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ecosystemLogos.map((logo, index) => (
              <motion.article
                key={logo.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.02 }}
                className="group flex h-20 items-center justify-center rounded-xl border border-black/10 bg-white/84 px-4"
                title={logo.name}
              >
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  loading="lazy"
                  className="h-8 w-auto max-w-[90px] object-contain opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
                />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
          <h2 className="text-center text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">What early users say</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.article
                key={testimonial.author}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                className="rounded-2xl border border-black/10 bg-white/86 p-6"
              >
                <p className="text-lg leading-relaxed tracking-tight">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="mt-4 text-sm text-black/58">&mdash; {testimonial.author}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-14 text-center">
            <p className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              When seconds matter, nothing else should.
            </p>
            <Link href="/buy-now" className="mt-8 inline-flex rounded-full bg-black px-8 py-3 text-sm font-medium text-white transition hover:bg-black/84">
              View Buy Page
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
