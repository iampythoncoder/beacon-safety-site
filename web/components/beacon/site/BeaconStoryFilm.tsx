"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

type BeaconStoryFilmProps = {
  onStageChange: (stage: number) => void;
};

export function BeaconStoryFilm({ onStageChange }: BeaconStoryFilmProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.45
  });

  const scene1Opacity = useTransform(progress, [0, 0.2, 0.34], [1, 1, 0]);
  const scene2Opacity = useTransform(progress, [0.22, 0.42, 0.58], [0, 1, 0]);
  const scene3Opacity = useTransform(progress, [0.5, 0.68, 0.82], [0, 1, 0]);
  const scene4Opacity = useTransform(progress, [0.74, 0.9, 1], [0, 1, 1]);

  const stageNumber = useTransform(progress, (value) => {
    if (value < 0.3) return 0;
    if (value < 0.56) return 1;
    if (value < 0.8) return 2;
    return 3;
  });

  useMotionValueEvent(stageNumber, "change", (value) => {
    onStageChange(Math.round(value));
  });

  const fingerY = useTransform(progress, [0.04, 0.14, 0.24, 0.32], [0, 20, 20, 0]);
  const buttonScale = useTransform(progress, [0.08, 0.17, 0.25], [1, 0.74, 1]);
  const rippleScale = useTransform(progress, [0.12, 0.32], [0.85, 2.5]);
  const rippleOpacity = useTransform(progress, [0.12, 0.32], [0.5, 0]);
  const rippleScaleSecond = useTransform(progress, [0.16, 0.36], [0.85, 2.1]);
  const rippleOpacitySecond = useTransform(progress, [0.16, 0.36], [0.38, 0]);

  const packetX = useTransform(progress, [0.24, 0.56], [35, 58]);
  const packetY = useTransform(progress, [0.24, 0.56], [60, 42]);
  const packetOpacity = useTransform(progress, [0.22, 0.28, 0.54, 0.6], [0, 1, 1, 0]);
  const packetLeft = useTransform(packetX, (value) => `${value}%`);
  const packetTop = useTransform(packetY, (value) => `${value}%`);

  const packet2X = useTransform(progress, [0.3, 0.62], [35, 58]);
  const packet2Y = useTransform(progress, [0.3, 0.62], [60, 42]);
  const packet2Opacity = useTransform(progress, [0.28, 0.34, 0.6, 0.66], [0, 0.9, 0.9, 0]);
  const packet2Left = useTransform(packet2X, (value) => `${value}%`);
  const packet2Top = useTransform(packet2Y, (value) => `${value}%`);

  const cloudPulseScale = useTransform(progress, [0.5, 0.78], [0.8, 2.4]);
  const cloudPulseOpacity = useTransform(progress, [0.5, 0.78], [0.48, 0]);
  const cloudPulseScaleSecond = useTransform(progress, [0.56, 0.82], [0.8, 1.9]);
  const cloudPulseOpacitySecond = useTransform(progress, [0.56, 0.82], [0.35, 0]);
  const phoneCard1Y = useTransform(progress, [0.52, 0.66], [18, 0]);
  const phoneCard1Opacity = useTransform(progress, [0.5, 0.56, 0.82], [0, 1, 1]);
  const phoneCard2Y = useTransform(progress, [0.58, 0.72], [22, 0]);
  const phoneCard2Opacity = useTransform(progress, [0.56, 0.62, 0.86], [0, 1, 1]);

  const responderX = useTransform(progress, [0.8, 1], [78, 24]);
  const responderLeft = useTransform(responderX, (value) => `${value}%`);
  const responderOpacity = useTransform(progress, [0.78, 0.84], [0, 1]);
  const routeDraw = useTransform(progress, [0.8, 1], [0, 1]);
  const arrivalScale = useTransform(progress, [0.88, 1], [0.82, 2.3]);
  const arrivalOpacity = useTransform(progress, [0.88, 1], [0.5, 0]);

  const filmProgress = useTransform(progress, [0, 1], [0.06, 1]);

  return (
    <div ref={ref} className="relative h-[240vh]">
      <div className="sticky top-24 h-[78vh] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

        <motion.div style={{ opacity: scene1Opacity }} className="absolute inset-0">
          <div className="absolute left-[10%] top-[62%]">
            <div className="relative h-28 w-16">
              <div className="absolute left-5 top-0 h-6 w-6 rounded-full bg-white/92" />
              <div className="absolute left-3 top-6 h-16 w-10 rounded-2xl bg-white/92" />
            </div>
          </div>

          <div className="absolute left-[26%] top-[51%] h-28 w-44 rounded-[2rem] border border-white/20 bg-[linear-gradient(160deg,#1f1f1f,#090909)]" />
          <motion.div
            style={{ y: fingerY }}
            className="absolute left-[36%] top-[42%] h-9 w-3 rounded-full border border-white/30 bg-white"
          />
          <motion.div
            style={{ scale: buttonScale }}
            className="absolute left-[36.5%] top-[57%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/95"
          />
          <motion.div
            style={{ scale: rippleScale, opacity: rippleOpacity }}
            className="absolute left-[36.5%] top-[57%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
          />
          <motion.div
            style={{ scale: rippleScaleSecond, opacity: rippleOpacitySecond }}
            className="absolute left-[36.5%] top-[57%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45"
          />
          <p className="absolute left-[8%] top-[84%] text-xs tracking-[0.16em] text-white/75">Scene 1: Trigger pressed</p>
        </motion.div>

        <motion.div style={{ opacity: scene2Opacity }} className="absolute inset-0">
          <div className="absolute left-[18%] top-[53%] h-24 w-36 rounded-[1.6rem] border border-white/18 bg-[linear-gradient(160deg,#1f1f1f,#090909)]" />
          <div className="absolute left-[54%] top-[36%] rounded-xl border border-white/20 bg-white/8 px-4 py-3 text-xs text-white/86">
            Cloud relay
          </div>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M35 60 C42 56, 49 50, 58 43" stroke="rgba(255,255,255,0.26)" strokeWidth="1.6" fill="none" />
          </svg>
          <motion.div
            style={{ left: packetLeft, top: packetTop, opacity: packetOpacity }}
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          />
          <motion.div
            style={{ left: packet2Left, top: packet2Top, opacity: packet2Opacity }}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/82"
          />
          <p className="absolute left-[8%] top-[84%] text-xs tracking-[0.16em] text-white/75">Scene 2: Signal transfers</p>
        </motion.div>

        <motion.div style={{ opacity: scene3Opacity }} className="absolute inset-0">
          <div className="absolute left-[48%] top-[44%] rounded-xl border border-white/20 bg-white/8 px-4 py-3 text-xs text-white/86">
            Sending alert...
          </div>
          <motion.div
            style={{ scale: cloudPulseScale, opacity: cloudPulseOpacity }}
            className="absolute left-[53%] top-[50%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
          />
          <motion.div
            style={{ scale: cloudPulseScaleSecond, opacity: cloudPulseOpacitySecond }}
            className="absolute left-[53%] top-[50%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45"
          />

          <motion.div
            style={{ y: phoneCard1Y, opacity: phoneCard1Opacity }}
            className="absolute left-[71%] top-[28%] rounded-xl border border-white/20 bg-white/8 px-4 py-3"
          >
            <p className="text-[10px] tracking-[0.16em] text-white/62">PHONE</p>
            <p className="mt-1 text-xs text-white/95">Incoming emergency</p>
          </motion.div>
          <motion.div
            style={{ y: phoneCard2Y, opacity: phoneCard2Opacity }}
            className="absolute left-[71%] top-[56%] rounded-xl border border-white/20 bg-white/8 px-4 py-3"
          >
            <p className="text-[10px] tracking-[0.16em] text-white/62">PHONE</p>
            <p className="mt-1 text-xs text-white/95">Location attached</p>
          </motion.div>
          <p className="absolute left-[8%] top-[84%] text-xs tracking-[0.16em] text-white/75">Scene 3: Contacts alerted</p>
        </motion.div>

        <motion.div style={{ opacity: scene4Opacity }} className="absolute inset-0">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M22 68 C36 65, 55 65, 80 68" stroke="rgba(255,255,255,0.28)" strokeWidth="1.9" fill="none" />
            <motion.path
              d="M22 68 C36 65, 55 65, 80 68"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="2.2"
              fill="none"
              style={{ pathLength: routeDraw }}
            />
          </svg>

          <div className="absolute left-[20%] top-[65%] h-7 w-7 rounded-full border border-white/25 bg-white/10">
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
          <motion.div
            style={{ left: responderLeft, opacity: responderOpacity }}
            className="absolute top-[66.5%] h-6 w-10 -translate-x-1/2 rounded-lg border border-white/20 bg-white/90"
          >
            <div className="absolute -bottom-1 left-2 h-2 w-2 rounded-full bg-white" />
            <div className="absolute -bottom-1 right-2 h-2 w-2 rounded-full bg-white" />
          </motion.div>
          <motion.div
            style={{ scale: arrivalScale, opacity: arrivalOpacity }}
            className="absolute left-[21%] top-[66%] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/85"
          />
          <p className="absolute left-[8%] top-[84%] text-xs tracking-[0.16em] text-white/75">Scene 4: Responder arrives</p>
        </motion.div>

        <div className="absolute bottom-5 left-5 right-5 h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.div style={{ scaleX: filmProgress }} className="h-full origin-left rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}
