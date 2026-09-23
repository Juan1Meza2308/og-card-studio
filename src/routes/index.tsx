import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Suspense, lazy } from "react";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroShowcase } from "@/components/ogcraft/hero-showcase";
import {
  CtaBand,
  FeatureGrid,
  GenerationLog,
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
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 pt-28 sm:gap-14 sm:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <motion.div
              className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
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
                className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
              >
                Dynamic OG Images via a <span className="text-primary">Single API URL</span>
              </motion.h1>
              <motion.p
                variants={staggerItem}
                className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0"
              >
                Generate beautiful, customizable social share cards on the fly for your blog,
                e-commerce, or app in milliseconds.
              </motion.p>
              <motion.div
                variants={staggerItem}
                className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
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
                className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground lg:justify-start"
              >
                {["No credit card", "42ms average", "Global edge cache"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-success" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>
            <HeroShowcase />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="relative z-10 mx-auto mt-14 max-w-6xl border-t border-border/60 px-5 pt-6 sm:mt-20 sm:pt-8"
          >
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Works wherever you already build
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-foreground/80">
              {["Next.js", "Astro", "Vite", "Shopify", "Remix", "Plain HTML"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </motion.div>
        </section>
        <GenerationLog />
        <section className="section-shell">
          <div className="section-heading">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps between you and perfect cards.
            </h2>
            <p>
              Compose, render, ship. No build step, no CDN config, no image pipeline to maintain.
            </p>
          </div>
          <StoryRows />
        </section>
        <section className="section-shell border-t border-border/70">
          <div className="section-heading">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Try it live, right here.
            </h2>
            <p>
              Type a title, pick a theme, and watch social cards render in real time. No account
              needed.
            </p>
          </div>
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
        </section>
        <section className="section-shell border-t border-border/70">
          <div className="section-heading">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              The missing image layer for your stack.
            </h2>
            <p>
              Designed for developers who care about speed, consistency, and details that convert.
            </p>
          </div>
          <FeatureGrid />
        </section>
        <section className="section-shell border-t border-border/70">
          <div className="section-heading">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Start free. Scale without surprises.
            </h2>
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
