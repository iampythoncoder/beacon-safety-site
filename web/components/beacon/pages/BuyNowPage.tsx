"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const included = [
  "BEACON hardware device",
  "Emergency contact configuration",
  "SMS + app alert dispatch",
  "Live delivery status feedback",
  "Firmware and reliability updates"
];

const faqs = [
  {
    q: "What do I pay at checkout?",
    a: "Checkout starts with a $25 one-time device payment, then billing continues at $3 per month."
  },
  {
    q: "Can I cancel the monthly plan?",
    a: "Yes, membership can be cancelled at any time from your account settings."
  },
  {
    q: "When does shipping begin?",
    a: "Orders are fulfilled in release batches, and customers receive email updates before dispatch."
  }
];

export function BuyNowPage() {
  return (
    <div>
      <section className="border-b border-black/10">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.04fr_0.96fr] lg:px-12 lg:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="text-[11px] tracking-[0.28em] text-black/48"
            >
              BUY NOW
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06 }}
              className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl"
            >
              Currently sold out.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14 }}
              className="mt-6 max-w-2xl text-base leading-relaxed text-black/64 sm:text-lg"
            >
              BEACON pricing remains $25 one-time plus $3 per month, and the next drop will reopen once inventory is ready.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full border border-black/15 bg-black/[0.04] px-7 py-3 text-sm font-medium text-black/38"
              >
                Sold Out
              </button>
              <Link
                href="/#overview"
                className="rounded-full border border-black/20 px-7 py-3 text-sm font-medium transition hover:bg-black hover:text-white"
              >
                Back to Site
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.16 }}
            className="rounded-3xl border border-black/12 bg-white/88 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.1)]"
          >
            <p className="text-[11px] tracking-[0.24em] text-black/48">PRICE BREAKDOWN</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-end justify-between border-b border-black/10 pb-3">
                <span className="text-base text-black/65">Device (one-time)</span>
                <span className="text-3xl font-semibold tracking-[-0.04em]">$25</span>
              </div>
              <div className="flex items-end justify-between border-b border-black/10 pb-3">
                <span className="text-base text-black/65">Safety membership</span>
                <span className="text-3xl font-semibold tracking-[-0.04em]">$3/mo</span>
              </div>
            </div>
            <p className="mt-5 text-sm text-black/62">Total at activation starts at $28, then continues at $3 monthly.</p>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-black/10 py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">What is included</h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-black/63 sm:text-lg">
              Every purchase includes the hardware and network access required to keep BEACON emergency alerts active.
            </p>
          </div>
          <div className="space-y-3">
            {included.map((item, index) => (
              <motion.article
                key={item}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: index * 0.04 }}
                className="rounded-2xl border border-black/10 bg-white/84 px-5 py-4 text-base text-black/74"
              >
                {item}
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
          <h2 className="text-center text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Purchase FAQs</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <article key={item.q} className="rounded-2xl border border-black/10 bg-white/84 p-6">
                <h3 className="text-lg font-semibold tracking-tight">{item.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-black/63">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
