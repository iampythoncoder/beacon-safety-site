"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const homeTabs = [
  { id: "overview", label: "Overview" },
  { id: "technology", label: "Technology" },
  { id: "mission", label: "Mission" },
  { id: "trust", label: "Trust" },
  { id: "testimonials", label: "Voices" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [activeAnchor, setActiveAnchor] = useState("overview");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 20,
    mass: 0.35
  });
  const { scrollY } = useScroll();
  const brandScale = useTransform(scrollY, [0, 160], [1, 0.62]);
  const brandY = useTransform(scrollY, [0, 160], [0, -8]);

  useEffect(() => {
    if (!isHome) return;

    const observers: IntersectionObserver[] = [];

    homeTabs.forEach((tab) => {
      const target = document.getElementById(tab.id);
      if (!target) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveAnchor(tab.id);
            }
          });
        },
        {
          threshold: 0.55,
          rootMargin: "-25% 0px -35% 0px"
        }
      );

      observer.observe(target);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [isHome]);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-black/10 bg-[#f6f6f4]/88 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-6 px-6 py-4 lg:px-12">
        <motion.div style={{ scale: brandScale, y: brandY }} className="origin-left">
          <Link href="/" className="inline-block text-5xl font-semibold leading-none tracking-[-0.09em] sm:text-6xl md:text-7xl">
            BEACON
          </Link>
        </motion.div>

        <div className="flex flex-col items-end gap-2 pt-1">
          <nav className="hidden items-center gap-2 lg:flex">
            {isHome &&
              homeTabs.map((tab) => (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeAnchor === tab.id ? "bg-black text-white" : "bg-black/[0.03] text-black/68 hover:bg-black/[0.08]"
                  }`}
                >
                  {tab.label}
                </a>
              ))}

            {!isHome && (
              <Link href="/" className="rounded-full bg-black/[0.03] px-4 py-2 text-sm text-black/68 transition hover:bg-black/[0.08]">
                Home
              </Link>
            )}

            <Link
              href="/buy-now"
              className="rounded-full border border-black/15 bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85"
            >
              Buy
            </Link>
          </nav>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {isHome &&
              homeTabs.map((tab) => (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                    activeAnchor === tab.id ? "bg-black text-white" : "bg-black/[0.03] text-black/70"
                  }`}
                >
                  {tab.label}
                </a>
              ))}

            {!isHome && (
              <Link href="/" className="shrink-0 rounded-full bg-black/[0.03] px-3 py-1.5 text-xs text-black/70">
                Home
              </Link>
            )}

            <Link href="/buy-now" className="shrink-0 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
              Buy
            </Link>
          </div>
        </div>
      </div>
      <motion.div style={{ scaleX }} className="h-px origin-left bg-black/45" />
    </motion.header>
  );
}
