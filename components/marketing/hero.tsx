"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getModel } from "@/lib/data/models";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

/**
 * Ecosystem art — node position/shape is decorative, but name and per-request
 * price are resolved live from `lib/data/models.ts` so this can never drift
 * from the real catalog. Each node gets its own shelf height and hub entry
 * point, deliberately un-mirrored, so the four cables read as distinct routes
 * instead of a symmetric, repeating pattern.
 */
const NODE_LAYOUT: Array<{ slug: string; x: number; y: number; shelfY: number; targetX: number }> = [
  { slug: "claude-sonnet-5", x: 13, y: 12, shelfY: 29, targetX: 39 },
  { slug: "gpt-5", x: 33, y: 5, shelfY: 47, targetX: 44 },
  { slug: "gemini-2-5-pro", x: 67, y: 5, shelfY: 37, targetX: 59 },
  { slug: "llama-4-maverick", x: 87, y: 12, shelfY: 43, targetX: 63 },
];

const NODES = NODE_LAYOUT.flatMap((layout) => {
  const model = getModel(layout.slug);
  if (!model) return [];
  return [{ ...layout, name: model.name, price: `from ${formatMoney(model.pricing.perRequest.estMin)}` }];
});

const HERO_SONNET_5 = getModel("claude-sonnet-5");

const HUB = { x: 50, y: 50 };

const PROVIDERS = ["OpenAI", "Anthropic", "Google", "Meta", "Mistral"];

const STARS = [
  { x: 14, y: 24, size: 2, delay: 0 },
  { x: 26, y: 55, size: 1.5, delay: 0.6 },
  { x: 40, y: 15, size: 1.5, delay: 1.2 },
  { x: 58, y: 20, size: 2, delay: 0.3 },
  { x: 72, y: 48, size: 1.5, delay: 1.8 },
  { x: 85, y: 28, size: 2, delay: 0.9 },
  { x: 18, y: 80, size: 1.5, delay: 1.5 },
  { x: 62, y: 82, size: 2, delay: 0.4 },
  { x: 90, y: 75, size: 1.5, delay: 1.1 },
  { x: 48, y: 8, size: 1.5, delay: 2.1 },
];

type Node = (typeof NODES)[number];

/** Straight runs on their own lane (drop → shelf → merge) — routed like organized cabling. */
function cablePath(node: Node, hub: { x: number; y: number }) {
  return `M ${node.x} ${node.y} L ${node.x} ${node.shelfY} L ${node.targetX} ${node.shelfY} L ${node.targetX} ${hub.y}`;
}

function GlassCard({
  className,
  children,
  delay = 0,
  float = 0,
  rotate = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  float?: number;
  rotate?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96, rotate: rotate * 2 }}
      animate={
        reduceMotion
          ? { opacity: 1, y: 0, scale: 1, rotate }
          : { opacity: 1, y: [0, -float, 0], scale: 1, rotate }
      }
      transition={
        reduceMotion
          ? { duration: 0.6, delay }
          : {
              opacity: { duration: 0.6, delay },
              scale: { duration: 0.6, delay },
              rotate: { duration: 0.6, delay },
              y: { duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay },
            }
      }
      className={`absolute z-10 hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl xl:block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 50, y: 40 });
  const reduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPointer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const parallax = (strength: number) =>
    reduceMotion
      ? undefined
      : {
          transform: `translate3d(${(pointer.x - 50) * strength}px, ${(pointer.y - 50) * strength}px, 0)`,
        };

  return (
    <section className="w-full px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative flex min-h-200 w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-black xl:min-h-230"
      >
        {/* matte base + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-neutral-950" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_180px_60px_rgba(0,0,0,0.85)]"
          aria-hidden
        />

        {/* radial glow, top-right */}
        <div
          className="pointer-events-none absolute -top-40 -right-20 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24),transparent_70%)] blur-2xl"
          aria-hidden
        />
        {/* soft glow, bottom-left */}
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.10),transparent_70%)] blur-2xl"
          aria-hidden
        />

        {/* mouse-reactive spotlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(500px circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.06), transparent 60%)`,
          }}
          aria-hidden
        />

        {/* vertical light beams */}
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden justify-center gap-16 opacity-40 lg:flex" aria-hidden>
          <div className="h-full w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          <div className="h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="h-full w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
        </div>

        {/* stars */}
        {STARS.map((star, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={reduceMotion ? undefined : { opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
            aria-hidden
          />
        ))}

        {/* ecosystem: curved connection lines + model nodes, converging on the hub */}
        <div
          className="pointer-events-none absolute inset-0 hidden xl:block"
          style={parallax(0.15)}
          aria-hidden
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id="lineFade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
              </linearGradient>
              {/* fades the cables out behind the headline/subtitle instead of cutting across the words */}
              <radialGradient id="hubMaskGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="black" />
                <stop offset="28%" stopColor="black" />
                <stop offset="52%" stopColor="white" />
                <stop offset="100%" stopColor="white" />
              </radialGradient>
              <mask id="textSafeMask">
                <rect x="0" y="0" width="100" height="100" fill="url(#hubMaskGradient)" />
              </mask>
            </defs>
            <g mask="url(#textSafeMask)">
              {NODES.map((node, i) => (
                <motion.path
                  key={node.name}
                  d={cablePath(node, HUB)}
                  fill="none"
                  stroke="url(#lineFade)"
                  strokeWidth={0.18}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1.5 2"
                  style={{
                    filter:
                      "drop-shadow(0 0 2px rgba(255,255,255,0.85)) drop-shadow(0 0 6px rgba(255,255,255,0.4))",
                  }}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1, strokeDashoffset: reduceMotion ? 0 : [0, -12] }}
                  transition={{
                    pathLength: { duration: 1.2, delay: 0.3 + i * 0.08, ease: "easeOut" },
                    opacity: { duration: 1.2, delay: 0.3 + i * 0.08 },
                    strokeDashoffset: { duration: 6, repeat: Infinity, ease: "linear" },
                  }}
                />
              ))}
            </g>

            {/* traveling light pulses — the "connection" animation along each cable */}
            {!reduceMotion && (
              <g mask="url(#textSafeMask)">
                {NODES.map((node, i) => (
                  <motion.circle
                    key={`pulse-${node.name}`}
                    r={0.5}
                    fill="#ffffff"
                    style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.95))" }}
                    initial={{ opacity: 0 }}
                    animate={{
                      cx: [node.x, node.x, node.targetX, node.targetX],
                      cy: [node.y, node.shelfY, node.shelfY, HUB.y],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 1.6 + i * 0.55,
                      times: [0, 0.4, 0.75, 1],
                    }}
                  />
                ))}
              </g>
            )}
          </svg>

          {NODES.map((node, i) => (
            <motion.div
              key={node.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: reduceMotion ? 0 : [0, -8, 0],
              }}
              transition={{
                opacity: { duration: 0.6, delay: 0.5 + i * 0.08 },
                scale: { duration: 0.6, delay: 0.5 + i * 0.08 },
                y: { duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
              }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col gap-0.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 backdrop-blur-sm"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-white">
                <span className="size-1.5 rounded-full bg-zinc-300" aria-hidden />
                {node.name}
              </span>
              <span className="text-xs tabular-nums text-white/45">{node.price} / req</span>
            </motion.div>
          ))}

          {/* glowing payment hub */}
          <motion.div
            className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.5),transparent_70%)]"
            style={{ left: `${HUB.x}%`, top: `${HUB.y}%` }}
            animate={reduceMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* floating UI cards */}
        <div className="absolute inset-0 hidden xl:block" style={parallax(0.06)} aria-hidden>
          <GlassCard className="top-36 left-10 w-52" delay={0.9} float={11} rotate={-3}>
            <p className="text-xs font-medium text-white/50">Cost Estimate</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-white/50">Claude Sonnet 5</span>
              <span className="text-lg font-semibold text-white">
                {HERO_SONNET_5
                  ? formatMoney(
                      (HERO_SONNET_5.pricing.perRequest.estMin +
                        HERO_SONNET_5.pricing.perRequest.estMax) /
                        2,
                    )
                  : "--"}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between border-t border-white/10 pt-1.5">
              <span className="text-xs text-white/40">Maximum</span>
              <span className="text-sm font-medium tabular-nums text-white/70">
                {HERO_SONNET_5 ? formatMoney(HERO_SONNET_5.pricing.perRequest.cap) : "--"}
              </span>
            </div>
          </GlassCard>

          <GlassCard className="top-52 right-6 w-52" delay={1.05} float={7} rotate={2}>
            <p className="text-xs font-medium text-white/50">Receipt</p>
            <dl className="mt-2 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-white/45">Prompt</dt>
                <dd className="tabular-nums text-white/70">$0.006</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/45">Completion</dt>
                <dd className="tabular-nums text-white/70">$0.041</dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-1.5 font-medium">
                <dt className="text-white/70">Total</dt>
                <dd className="tabular-nums text-white">$0.047</dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard className="bottom-32 left-24 w-44" delay={1.2} float={9} rotate={4}>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium text-white/50">Hard Cap</p>
              <span className="text-sm font-semibold text-white">$5.00</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-white/40 to-white" />
            </div>
          </GlassCard>

          <GlassCard className="bottom-20 right-16 w-48" delay={1.35} float={12} rotate={-2}>
            <p className="text-xs font-medium text-white/50">24 Hour Pass</p>
            <p className="mt-1.5 text-sm font-medium text-white">Unlimited Requests</p>
            <p className="mt-0.5 text-xs tabular-nums text-white/45">18h remaining</p>
          </GlassCard>
        </div>

        {/* center content */}
        <div className="relative z-20 mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
          >
            <Zap className="size-3.5 text-white/70" aria-hidden />
            Predict Cost. Approve Once. Get Every Receipt.
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            One-click billing
            <br />
            for{" "}
            <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              every AI model
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-lg text-lg text-white/55"
          >
            We show you the cost before it happens and the receipt after. Pay per request
            with a hard cap, or unlock a time pass when a burst of work makes more sense.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-white/85" asChild>
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link
                href="#how-it-works"
                onClick={(e) => {
                  const target = document.getElementById("how-it-works");
                  if (target) {
                    e.preventDefault();
                    window.history.pushState(null, "", "#how-it-works");
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                See How It Works
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-6 py-14">
        <p className="text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
          Models on the platform
        </p>
        <div className="flex w-full flex-wrap items-center justify-center gap-x-12 gap-y-3 text-sm font-medium text-muted-foreground/70">
          {PROVIDERS.map((provider) => (
            <span key={provider}>{provider}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
