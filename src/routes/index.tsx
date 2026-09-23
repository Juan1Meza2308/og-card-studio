import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Suspense, lazy } from "react";
import { ArrowRight, BookOpen, Check, Image, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CtaBand,
  FeatureGrid,
  PricingGrid,
  PublicFooter,
  PublicNav,
  StoryRows,
} from "@/components/ogcraft/marketing";
import { staggerContainer, staggerItem } from "@/lib/motion";

const Playground = lazy(() =>
  import("@/components/ogcraft/playground").then((m) => ({ default: m.Playground })),
);
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OGCraft — Dynamic OG Images via API" },
      {
        name: "description",
        content: "Generate beautiful, customizable social share cards through one fast API URL.",
      },
      { property: "og:title", content: "OGCraft — Dynamic OG Images via API" },
      {
        property: "og:description",
        content: "Generate beautiful social share cards through one fast API URL.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      <PublicNav />
      <main>
        <section className="hero-surface">
          <div className="hero-noise" />
          <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-36 sm:pt-44">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={staggerItem}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 font-mono text-[10px] uppercase text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-success animate-pulse" /> API v1 is live
              </motion.div>
              <motion.h1
                variants={staggerItem}
                className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl"
              >
                Dynamic OG Images via a <span className="text-gradient">Single API URL</span>
              </motion.h1>
              <motion.p
                variants={staggerItem}
                className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
              >
                Generate beautiful, customizable social share cards on the fly for your blog,
                e-commerce, or app in milliseconds.
              </motion.p>
              <motion.div
                variants={staggerItem}
                className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
              >
                <Button size="lg" asChild>
                  <Link to="/auth">
                    Start Free (100 imgs/mo) <ArrowRight />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/docs">
                    <BookOpen /> Explore Docs
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                variants={staggerItem}
                className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
              >
                {["No credit card", "42ms average", "Global edge cache"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-success" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 120, damping: 18 }}
              className="mt-16"
            >
              <Suspense
                fallback={
                  <div
                    className="overflow-hidden rounded-2xl border border-border/80 bg-workspace shadow-panel"
                    aria-label="Loading playground"
                  >
                    <div className="flex h-12 items-center justify-between border-b border-border/70 px-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full bg-success" /> Live playground
                      </div>
                      <div className="h-8 w-24 animate-pulse rounded-md bg-muted/60" />
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-[280px_1fr] sm:p-6">
                      <div className="space-y-3">
                        {[80, 100, 60, 90].map((w, i) => (
                          <div
                            key={i}
                            className="h-6 animate-pulse rounded bg-muted/50"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                      <div className="aspect-[1200/630] animate-pulse rounded-xl bg-muted/40" />
                    </div>
                  </div>
                }
              >
                <Playground />
              </Suspense>
            </motion.div>
          </div>
        </section>
        <section className="section-shell">
          <div className="section-heading">
            <p className="eyebrow">
              <Zap /> How it works
            </p>
            <h2>Three steps between you and perfect cards.</h2>
            <p>
              Compose, render, ship. No build step, no CDN config, no image pipeline to maintain.
            </p>
          </div>
          <StoryRows />
        </section>
        <section className="section-shell border-t border-border/70">
          <div className="section-heading">
            <p className="eyebrow">
              <Zap /> Built for shipping
            </p>
            <h2>The missing image layer for your stack.</h2>
            <p>
              Designed for developers who care about speed, consistency, and details that convert.
            </p>
          </div>
          <FeatureGrid />
        </section>
        <section className="section-shell border-t border-border/70">
          <div className="section-heading">
            <p className="eyebrow">
              <Image /> Predictable pricing
            </p>
            <h2>Start free. Scale without surprises.</h2>
            <p>
              Every plan includes our global API, starter templates, and instant cache invalidation.
            </p>
          </div>
          <PricingGrid />
        </section>
        <CtaBand />
      </main>
      <PublicFooter />
    </div>
  );
}
