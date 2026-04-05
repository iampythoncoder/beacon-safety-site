"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

const stages = [
  {
    title: "Trigger Alert",
    body: "A single press starts the emergency flow."
  },
  {
    title: "Device Activates",
    body: "BEACON powers up and emits an emergency signal."
  },
  {
    title: "Signal Transmits",
    body: "Encrypted packets move from BEACON to the relay."
  },
  {
    title: "Alert Processing",
    body: "The relay verifies metadata and prepares dispatch."
  },
  {
    title: "Alert Delivery",
    body: "The relay pushes alerts to connected phones."
  },
  {
    title: "Alert Received",
    body: "Your contact receives the emergency notification."
  }
] as const;

function getStage(progress: number) {
  if (progress < 0.16) return 0;
  if (progress < 0.33) return 1;
  if (progress < 0.5) return 2;
  if (progress < 0.67) return 3;
  if (progress < 0.84) return 4;
  return 5;
}

export function BeaconAlertFlow() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const progress = scrollYProgress;

  const [activeStage, setActiveStage] = useState(0);

  useMotionValueEvent(progress, "change", (latest) => {
    const next = getStage(latest);
    setActiveStage((current) => (current === next ? current : next));
  });

  const progressBarScale = useTransform(progress, [0, 1], [0.04, 1]);

  const scene1Opacity = useTransform(progress, [0, 0.12, 0.2], [1, 1, 0]);
  const scene2Opacity = useTransform(progress, [0.14, 0.27, 0.36], [0, 1, 0]);
  const scene3Opacity = useTransform(progress, [0.3, 0.43, 0.53], [0, 1, 0]);
  const scene4Opacity = useTransform(progress, [0.47, 0.6, 0.7], [0, 1, 0]);
  const scene5Opacity = useTransform(progress, [0.64, 0.77, 0.88], [0, 1, 0]);
  const scene6Opacity = useTransform(progress, [0.82, 0.94, 1], [0, 1, 1]);

  const fingerY = useTransform(progress, [0.03, 0.09, 0.16], [0, 26, 0]);
  const fingerOpacity = useTransform(progress, [0, 0.02, 0.17, 0.21], [0, 1, 1, 0]);
  const buttonScale = useTransform(progress, [0.04, 0.09, 0.16], [1, 0.72, 1]);
  const triggerRippleScaleA = useTransform(progress, [0.07, 0.21], [0.9, 2.4]);
  const triggerRippleOpacityA = useTransform(progress, [0.07, 0.21], [0.6, 0]);
  const triggerRippleScaleB = useTransform(progress, [0.09, 0.23], [0.9, 2.05]);
  const triggerRippleOpacityB = useTransform(progress, [0.09, 0.23], [0.42, 0]);

  const activationCoreScale = useTransform(progress, [0.17, 0.28, 0.35], [1, 1.07, 1]);
  const activationGlow = useTransform(progress, [0.16, 0.25, 0.36], [0.2, 0.62, 0.3]);
  const activationWaveScaleA = useTransform(progress, [0.18, 0.36], [0.92, 2.35]);
  const activationWaveOpacityA = useTransform(progress, [0.18, 0.36], [0.5, 0]);
  const activationWaveScaleB = useTransform(progress, [0.2, 0.38], [0.92, 1.95]);
  const activationWaveOpacityB = useTransform(progress, [0.2, 0.38], [0.35, 0]);

  const uplinkPathDraw = useTransform(progress, [0.34, 0.5], [0, 1]);
  const uplinkPacketAX = useTransform(progress, [0.36, 0.5], [0, 240]);
  const uplinkPacketAY = useTransform(progress, [0.36, 0.5], [0, -165]);
  const uplinkPacketAOpacity = useTransform(progress, [0.34, 0.38, 0.49, 0.54], [0, 1, 1, 0]);
  const uplinkPacketBX = useTransform(progress, [0.39, 0.53], [0, 240]);
  const uplinkPacketBY = useTransform(progress, [0.39, 0.53], [0, -165]);
  const uplinkPacketBOpacity = useTransform(progress, [0.37, 0.41, 0.52, 0.57], [0, 0.9, 0.9, 0]);

  const cloudPulseScaleA = useTransform(progress, [0.52, 0.68], [0.92, 2.2]);
  const cloudPulseOpacityA = useTransform(progress, [0.52, 0.68], [0.45, 0]);
  const cloudPulseScaleB = useTransform(progress, [0.55, 0.71], [0.92, 1.88]);
  const cloudPulseOpacityB = useTransform(progress, [0.55, 0.71], [0.32, 0]);
  const processingTextY = useTransform(progress, [0.53, 0.61], [12, 0]);
  const processingTextOpacity = useTransform(progress, [0.53, 0.61, 0.74], [0, 1, 1]);

  const downlinkPathDraw = useTransform(progress, [0.72, 0.87], [0, 1]);
  const downlinkPacketX = useTransform(progress, [0.74, 0.88], [0, 226]);
  const downlinkPacketY = useTransform(progress, [0.74, 0.88], [0, 74]);
  const downlinkPacketOpacity = useTransform(progress, [0.72, 0.76, 0.86, 0.91], [0, 1, 1, 0]);
  const phoneAppearOpacity = useTransform(progress, [0.73, 0.85], [0.22, 1]);
  const phoneAppearY = useTransform(progress, [0.73, 0.85], [22, 0]);

  const phoneBounceY = useTransform(progress, [0.89, 1], [8, 0]);
  const alertCardScale = useTransform(progress, [0.88, 1], [0.96, 1]);
  const alertCardOpacity = useTransform(progress, [0.86, 0.92], [0, 1]);
  const alertGlowScale = useTransform(progress, [0.89, 1], [0.9, 2.05]);
  const alertGlowOpacity = useTransform(progress, [0.89, 1], [0.42, 0]);

  return (
    <section id="technology" className="border-b border-black/10 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <p className="text-[11px] tracking-[0.28em] text-black/50">SCROLL EXPERIENCE</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Scroll through an illustrated sequence of BEACON from press to alert delivery.
        </h2>
      </div>

      <div ref={ref} className="relative mt-8 h-[340vh]">
        <div className="sticky top-20 mx-auto h-[82vh] w-full max-w-7xl px-6 lg:px-12">
          <div className="grid h-full gap-5 lg:grid-cols-[0.4fr_0.6fr]">
            <div className="hidden rounded-3xl border border-black/10 bg-white/88 p-6 lg:block">
              <p className="text-[11px] tracking-[0.24em] text-black/44">LIVE STAGE</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={stages[activeStage].title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="mt-3"
                >
                  <p className="text-xs tracking-[0.2em] text-black/45">STEP {activeStage + 1}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{stages[activeStage].title}</h3>
                  <p className="mt-3 text-sm text-black/62">{stages[activeStage].body}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-7 space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={stage.title}
                    className={`rounded-xl border px-4 py-3 text-sm transition ${
                      index === activeStage
                        ? "border-black/25 bg-black text-white"
                        : index < activeStage
                          ? "border-black/15 bg-black/[0.04] text-black/68"
                          : "border-black/10 bg-white text-black/48"
                    }`}
                  >
                    {stage.title}
                  </div>
                ))}
              </div>

              <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-black/10">
                <motion.div style={{ scaleX: progressBarScale }} className="h-full origin-left rounded-full bg-black" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#040404] shadow-[0_32px_78px_rgba(0,0,0,0.56)]">
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:42px_42px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_22%,rgba(255,255,255,0.14),rgba(255,255,255,0)_50%)]" />

              <div className="absolute left-4 top-4 z-20 rounded-xl border border-white/15 bg-white/7 px-3 py-2 lg:hidden">
                <p className="text-[10px] tracking-[0.18em] text-white/58">STEP {activeStage + 1}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stages[activeStage].title}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="mt-1 text-sm font-medium text-white"
                  >
                    {stages[activeStage].title}
                  </motion.p>
                </AnimatePresence>
              </div>

              <motion.svg viewBox="0 0 1200 700" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="beaconBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2a2a2a" />
                    <stop offset="100%" stopColor="#0a0a0a" />
                  </linearGradient>
                  <linearGradient id="deviceFace" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f5f5f5" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
                  </linearGradient>
                  <linearGradient id="cloudInk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f3f3f3" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
                  </linearGradient>
                </defs>

                <motion.g style={{ opacity: scene1Opacity }}>
                  <path d="M130 622 C108 568 122 490 182 468 C233 449 282 484 304 533 C322 572 300 628 248 646 C203 661 153 649 130 622 Z" fill="rgba(255,255,255,0.2)" />
                  <path d="M176 530 C226 516 266 536 282 578 C290 598 277 622 244 631 C208 640 171 628 155 599 C145 581 151 551 176 530 Z" fill="rgba(255,255,255,0.35)" />

                  <path d="M330 430 C330 387 364 354 408 354 H622 C667 354 700 387 700 430 V520 C700 564 667 597 622 597 H408 C364 597 330 564 330 520 Z" fill="url(#beaconBody)" stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
                  <rect x="360" y="382" width="310" height="70" rx="32" fill="url(#deviceFace)" />
                  <circle cx="513" cy="489" r="17" fill="rgba(255,255,255,0.95)" />
                  <circle cx="513" cy="489" r="30" fill="none" stroke="rgba(255,255,255,0.24)" />

                  <motion.path
                    style={{ y: fingerY, opacity: fingerOpacity }}
                    d="M525 356 C537 331 571 328 582 350 L595 380 C604 402 594 432 564 442 L529 455 C509 462 492 447 494 427 C495 411 507 399 520 392 L531 386 L520 363 C516 357 518 351 525 356 Z"
                    fill="rgba(255,255,255,0.88)"
                  />
                  <motion.circle
                    cx="513"
                    cy="489"
                    r="17"
                    style={{ scale: buttonScale }}
                    fill="rgba(255,255,255,1)"
                    transform="translate(0 0)"
                  />
                  <motion.circle cx="513" cy="489" r="17" style={{ scale: triggerRippleScaleA, opacity: triggerRippleOpacityA }} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" />
                  <motion.circle cx="513" cy="489" r="17" style={{ scale: triggerRippleScaleB, opacity: triggerRippleOpacityB }} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" />
                </motion.g>

                <motion.g style={{ opacity: scene2Opacity }}>
                  <path d="M362 290 C362 250 392 220 434 220 H774 C815 220 846 250 846 290 V446 C846 487 815 518 774 518 H434 C392 518 362 487 362 446 Z" fill="url(#beaconBody)" stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
                  <rect x="392" y="246" width="424" height="104" rx="40" fill="url(#deviceFace)" />
                  <motion.circle cx="604" cy="408" r="22" style={{ scale: activationCoreScale }} fill="rgba(255,255,255,0.96)" />
                  <motion.circle cx="604" cy="408" r="22" style={{ opacity: activationGlow }} fill="rgba(255,255,255,0.18)" />
                  <motion.circle cx="604" cy="408" r="22" style={{ scale: activationWaveScaleA, opacity: activationWaveOpacityA }} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" />
                  <motion.circle cx="604" cy="408" r="22" style={{ scale: activationWaveScaleB, opacity: activationWaveOpacityB }} fill="none" stroke="rgba(255,255,255,0.52)" strokeWidth="2.1" />
                  <text x="604" y="562" textAnchor="middle" fill="rgba(255,255,255,0.68)" fontSize="16" letterSpacing="4">
                    DEVICE ARMED
                  </text>
                </motion.g>

                <motion.g style={{ opacity: scene3Opacity }}>
                  <path d="M220 390 C220 356 247 328 282 328 H502 C537 328 564 356 564 390 V468 C564 503 537 530 502 530 H282 C247 530 220 503 220 468 Z" fill="url(#beaconBody)" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
                  <circle cx="392" cy="462" r="15" fill="rgba(255,255,255,0.95)" />
                  <text x="391" y="565" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="15" letterSpacing="4">
                    BEACON
                  </text>

                  <path d="M640 238 C640 209 666 186 699 189 C723 161 770 156 801 181 C838 174 873 205 868 242 C897 253 909 292 887 317 C868 341 835 341 816 332 H692 C655 334 628 303 634 270 C611 258 615 228 640 238 Z" fill="url(#cloudInk)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                  <text x="760" y="364" textAnchor="middle" fill="rgba(255,255,255,0.58)" fontSize="15" letterSpacing="4">
                    RELAY CLOUD
                  </text>

                  <path d="M392 462 C484 427 572 362 632 286" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" />
                  <motion.path d="M392 462 C484 427 572 362 632 286" stroke="rgba(255,255,255,0.92)" strokeWidth="2.6" fill="none" style={{ pathLength: uplinkPathDraw }} />
                  <motion.circle cx="392" cy="462" r="8" style={{ x: uplinkPacketAX, y: uplinkPacketAY, opacity: uplinkPacketAOpacity }} fill="rgba(255,255,255,1)" />
                  <motion.circle cx="392" cy="462" r="6.5" style={{ x: uplinkPacketBX, y: uplinkPacketBY, opacity: uplinkPacketBOpacity }} fill="rgba(255,255,255,0.84)" />
                </motion.g>

                <motion.g style={{ opacity: scene4Opacity }}>
                  <path d="M486 220 C486 176 524 140 573 147 C606 105 675 98 722 133 C777 122 830 161 823 215 C866 230 884 289 850 325 C823 356 778 355 748 340 H576 C525 342 487 301 495 251 C462 235 465 184 486 220 Z" fill="url(#cloudInk)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />

                  <rect x="584" y="220" width="160" height="102" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.24)" />
                  <rect x="600" y="241" width="128" height="18" rx="9" fill="rgba(255,255,255,0.22)" />
                  <rect x="600" y="268" width="128" height="18" rx="9" fill="rgba(255,255,255,0.15)" />
                  <rect x="600" y="295" width="128" height="18" rx="9" fill="rgba(255,255,255,0.12)" />
                  <circle cx="709" cy="250" r="4" fill="rgba(255,255,255,0.8)" />
                  <circle cx="709" cy="277" r="4" fill="rgba(255,255,255,0.6)" />
                  <circle cx="709" cy="304" r="4" fill="rgba(255,255,255,0.45)" />

                  <motion.circle cx="663" cy="274" r="26" style={{ scale: cloudPulseScaleA, opacity: cloudPulseOpacityA }} fill="none" stroke="rgba(255,255,255,0.84)" strokeWidth="2.3" />
                  <motion.circle cx="663" cy="274" r="26" style={{ scale: cloudPulseScaleB, opacity: cloudPulseOpacityB }} fill="none" stroke="rgba(255,255,255,0.52)" strokeWidth="2.1" />
                  <motion.text x="663" y="392" textAnchor="middle" fill="rgba(255,255,255,0.78)" fontSize="18" letterSpacing="4" style={{ y: processingTextY, opacity: processingTextOpacity }}>
                    SENDING ALERT...
                  </motion.text>
                </motion.g>

                <motion.g style={{ opacity: scene5Opacity }}>
                  <path d="M290 249 C290 221 314 198 346 201 C369 176 412 173 443 194 C479 189 512 216 508 250 C532 259 542 295 523 317 C508 338 479 338 462 332 H340 C304 334 277 305 283 274 C262 263 266 235 290 249 Z" fill="url(#cloudInk)" stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
                  <text x="397" y="378" textAnchor="middle" fill="rgba(255,255,255,0.58)" fontSize="14" letterSpacing="3">
                    CLOUD RELAY
                  </text>

                  <motion.g style={{ opacity: phoneAppearOpacity, y: phoneAppearY }}>
                    <rect x="778" y="205" width="178" height="328" rx="30" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.36)" strokeWidth="2" />
                    <rect x="795" y="233" width="144" height="260" rx="18" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.22)" />
                    <circle cx="867" cy="510" r="8" fill="rgba(255,255,255,0.2)" />
                    <text x="867" y="563" textAnchor="middle" fill="rgba(255,255,255,0.58)" fontSize="14" letterSpacing="3">
                      CONTACT PHONE
                    </text>
                  </motion.g>

                  <path d="M442 269 C554 275 673 298 778 343" stroke="rgba(255,255,255,0.24)" strokeWidth="2" fill="none" />
                  <motion.path d="M442 269 C554 275 673 298 778 343" stroke="rgba(255,255,255,0.92)" strokeWidth="2.6" fill="none" style={{ pathLength: downlinkPathDraw }} />
                  <motion.circle cx="442" cy="269" r="7.5" style={{ x: downlinkPacketX, y: downlinkPacketY, opacity: downlinkPacketOpacity }} fill="rgba(255,255,255,0.98)" />
                </motion.g>

                <motion.g style={{ opacity: scene6Opacity }}>
                  <motion.g style={{ y: phoneBounceY }}>
                    <rect x="475" y="130" width="260" height="460" rx="42" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.42)" strokeWidth="2.2" />
                    <rect x="500" y="172" width="210" height="360" rx="24" fill="rgba(0,0,0,0.62)" stroke="rgba(255,255,255,0.24)" />
                    <circle cx="605" cy="555" r="10" fill="rgba(255,255,255,0.24)" />
                  </motion.g>

                  <motion.rect x="435" y="330" width="340" height="112" rx="20" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.34)" style={{ opacity: alertCardOpacity, scale: alertCardScale }} />
                  <motion.text x="605" y="374" textAnchor="middle" fill="rgba(255,255,255,0.92)" fontSize="24" style={{ opacity: alertCardOpacity }}>
                    🚨 EMERGENCY ALERT RECEIVED
                  </motion.text>
                  <motion.text x="605" y="404" textAnchor="middle" fill="rgba(255,255,255,0.68)" fontSize="16" letterSpacing="2" style={{ opacity: alertCardOpacity }}>
                    Location + priority details attached
                  </motion.text>

                  <motion.circle cx="605" cy="386" r="92" style={{ scale: alertGlowScale, opacity: alertGlowOpacity }} fill="none" stroke="rgba(255,255,255,0.74)" strokeWidth="2.2" />
                </motion.g>
              </motion.svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
