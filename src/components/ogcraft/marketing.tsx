import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  Code2,
  Github,
  Image,
  Layers3,
  Menu,
  Radio,
  Sparkles,
  X,
  Zap,
  Shield,
  Globe,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { staggerContainer, staggerItem } from "@/lib/motion";

const links = [
  { label: "Features", to: "/features" },
  { label: "Playground", to: "/playground" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
] as const;

export function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 mx-auto max-w-5xl px-4 pt-4">
      <div className="flex min-h-14 items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 backdrop-blur-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.1)]">
        <Link to="/" aria-label="OGCraft home" className="focus-visible:outline-none">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {links.map((item) => (
            <Button
              variant="ghost"
              size="sm"
              asChild
              key={item.to}
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground transition-colors duration-150"
            >
              <Link
                to={item.to}
                className="px-3 py-2 rounded-md text-sm font-medium hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button size="sm" asChild className="text-sm font-medium gap-2">
            <Link to="/auth" className="flex items-center gap-2">
              Get API Key Free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <ThemeToggle />
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>
      {open && (
        <div className="mt-2 rounded-xl border border-border/60 bg-card/80 p-2 backdrop-blur-xl shadow-lg md:hidden animate-slide-down">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((item) => (
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-3 text-sm font-medium rounded-lg"
                asChild
                key={item.to}
              >
                <Link to={item.to} onClick={() => setOpen(false)} className="w-full">
                  {item.label}
                </Link>
              </Button>
            ))}
            <div className="border-t border-border/50 my-1" />
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-sm font-medium">Appearance</span>
              <ThemeToggle />
            </div>
            <Button
              className="mt-1 w-full justify-center px-4 py-3 text-sm font-medium rounded-lg"
              asChild
            >
              <Link to="/auth" onClick={() => setOpen(false)}>
                Get API Key Free
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Dynamic images, built for the open web.
          </p>
        </div>
        <nav
          className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
          aria-label="Footer navigation"
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <Link to="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="/status" className="hover:text-foreground transition-colors">
            Status
          </a>
        </nav>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} OGCraft. Built by developers, for developers.
        </p>
      </div>
    </footer>
  );
}

const featureItems = [
  {
    icon: Cpu,
    title: "Edge-fast rendering",
    text: "Every image is generated close to your audience and cached automatically at the edge.",
  },
  {
    icon: Code2,
    title: "One URL API",
    text: "Ship production-ready social cards with a single URL and predictable parameters.",
  },
  {
    icon: Layers3,
    title: "Composable templates",
    text: "Start with polished defaults, then tune content, colors, logos, and layout.",
  },
  {
    icon: Globe,
    title: "Framework agnostic",
    text: "Use OGCraft with Next.js, plain HTML, Astro, Shopify, or any HTTP client.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    text: "API keys hashed with SHA-256, row-level security, and scoped access tokens.",
  },
  {
    icon: Zap,
    title: "Real-time preview",
    text: "See your OG card update instantly as you type — no deploy, no wait.",
  },
];

export function FeatureGrid() {
  return (
    <section className="relative" aria-labelledby="features-heading">
      <motion.div
        className="grid gap-x-10 gap-y-10 md:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {featureItems.map((item) => (
          <motion.div
            key={item.title}
            variants={staggerItem}
            className="group border-t border-border/60 pt-6 transition-colors duration-300"
          >
            <div className="icon-box">
              <item.icon className="size-5 text-primary" strokeWidth={2} />
            </div>
            <h3 className="mt-4 text-lg font-semibold leading-tight">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const plans = [
  {
    name: "Free",
    monthly: "$0",
    yearly: "$0",
    period: "/mo",
    text: "For personal projects and prototypes.",
    features: [
      "100 images / month",
      "4 starter templates",
      "OGCraft watermark",
      "Community support",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Pro",
    monthly: "$12",
    yearly: "$9",
    period: "/mo",
    text: "For products ready to grow.",
    features: [
      "5,000 images / month",
      "Custom templates",
      "No watermark",
      "Priority support",
      "Analytics dashboard",
    ],
    cta: "Choose Pro",
    popular: true,
  },
  {
    name: "Agency",
    monthly: "$39",
    yearly: "$32",
    period: "/mo",
    text: "For teams shipping at scale.",
    features: [
      "50,000 images / month",
      "Team access & SSO",
      "Ultra-low latency",
      "Dedicated support",
      "Custom SLA",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

export function PricingGrid() {
  const [yearly, setYearly] = useState(true);
  return (
    <section className="relative" aria-labelledby="pricing-heading">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="mb-10 flex items-center justify-center gap-3"
      >
        <span
          className={`text-sm transition-colors ${yearly ? "text-muted-foreground" : "text-foreground"}`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((v) => !v)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            className={`inline-block size-4 transform rounded-full bg-primary shadow-sm transition-transform duration-300 ${
              yearly ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`flex items-center gap-2 text-sm transition-colors ${yearly ? "text-foreground" : "text-muted-foreground"}`}
        >
          Yearly
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
            Save 25%
          </span>
        </span>
      </motion.div>
      <motion.div
        className="grid gap-6 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {plans.map((plan) => (
          <motion.article
            key={plan.name}
            variants={staggerItem}
            whileHover="hover"
            className={`relative rounded-2xl border p-7 transition-colors duration-300 ${
              plan.popular
                ? "border-primary/40 bg-primary/5 shadow-glow"
                : "border-border/60 bg-card/50 hover:border-primary/20"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase text-primary-foreground shadow-glow">
                  <Sparkles className="size-3" />
                  Most popular
                </span>
              </div>
            )}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <motion.span
                  key={yearly ? "y" : "m"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="text-4xl font-bold tracking-tight"
                >
                  {yearly ? plan.yearly : plan.monthly}
                </motion.span>
                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
              </div>
              {plan.monthly !== plan.yearly && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {yearly ? (
                    <>
                      Billed annually — save $
                      {(parseInt(plan.monthly.slice(1), 10) - parseInt(plan.yearly.slice(1), 10)) *
                        12}
                      /yr
                    </>
                  ) : (
                    <>Switch to yearly and save 25%</>
                  )}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">{plan.text}</p>
            <ul className="mb-8 space-y-3" role="list">
              {plan.features.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="size-5 text-success flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-muted-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? "default" : "outline"}
              className="w-full py-3 text-sm font-medium"
              asChild
            >
              <Link to="/auth" className="flex items-center justify-center gap-2">
                {plan.cta}
                {plan.popular && <ArrowRight className="size-4" />}
              </Link>
            </Button>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

export function PageIntro({
  eyebrow,
  title,
  text,
  icon: Icon = Sparkles,
}: {
  eyebrow: string;
  title: string;
  text: string;
  icon?: typeof Sparkles;
}) {
  return (
    <motion.div
      className="mx-auto max-w-3xl pt-20 text-center"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.span
        variants={staggerItem}
        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 font-mono text-[10px] uppercase text-primary"
      >
        <Icon className="size-3.5" strokeWidth={2} />
        {eyebrow}
      </motion.span>
      <motion.h1
        variants={staggerItem}
        className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-wrap-balance"
      >
        {title}
      </motion.h1>
      <motion.p
        variants={staggerItem}
        className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground"
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

export function CtaBand() {
  return (
    <section className="relative px-5 py-16 sm:py-24" aria-labelledby="cta-heading">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-primary px-6 py-14 sm:px-12 sm:py-16 shadow-glow"
      >
        {/* Hairline top light — subtle inner rim, no gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"
        />
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <motion.div variants={staggerItem} className="max-w-xl">
            <motion.p
              variants={staggerItem}
              className="font-mono text-xs uppercase text-primary-foreground/70"
            >
              Ready to ship
            </motion.p>
            <motion.h2
              variants={staggerItem}
              id="cta-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl text-balance"
            >
              One URL. Every social card.
            </motion.h2>
            <motion.p variants={staggerItem} className="mt-3 text-primary-foreground/75">
              Grab a free API key and replace your first og:image tag in under five minutes.
            </motion.p>
          </motion.div>
          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem}>
              <Button
                size="lg"
                asChild
                className="bg-white text-primary shadow-sm hover:bg-white/90 gap-2"
              >
                <Link to="/auth" className="flex items-center gap-2">
                  Start free — 100 images/mo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2"
              >
                <Link to="/playground" className="flex items-center gap-2">
                  <Image className="size-4" />
                  Try playground
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

const storyRows = [
  {
    index: "01",
    title: "Tune content right from the URL.",
    text: "Title, subtitle, theme, and template are plain query parameters. No SDK required — just swap the values and your social card follows.",
    points: ["Plain URL parameters", "4 curated templates", "Live preview as you type"],
    visual: (
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-workspace font-mono text-xs shadow-panel">
        <div className="flex h-10 items-center gap-1.5 border-b border-border/60 px-4">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-muted-foreground">api.ogcraft.dev</span>
        </div>
        <div className="p-5">
          <p className="text-primary">GET</p>
          <p className="mt-2 break-all leading-6 text-muted-foreground">
            /v1/og?title=<span className="text-foreground">Ship fast</span>&amp;theme=
            <span className="text-foreground">violet</span>&amp;template=
            <span className="text-foreground">tech</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    index: "02",
    title: "Rendered at the edge, cached for the world.",
    text: "Every card is drawn close to your audience on a global edge network and cached automatically. The first hit is fast; every hit after is instant.",
    points: ["42ms median render time", "Global edge network", "Automatic cache headers"],
    visual: (
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-workspace shadow-panel">
        <div className="flex h-10 items-center gap-1.5 border-b border-border/60 px-4">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-muted-foreground">edge.ogcraft.dev</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2">
            {["fRA", "IAD", "SIN", "GRU"].map((region, i) => (
              <div
                key={region}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2.5 text-xs"
                style={{ opacity: 0.55 + i * 0.15 }}
              >
                <span className="font-semibold">{region}</span>
                <span className="text-muted-foreground">12–38ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    index: "03",
    title: "Drop one meta tag and go live.",
    text: "Point your og:image at the generated URL and your link previews upgrade everywhere — Slack, X, LinkedIn, WhatsApp. Zero redeploys.",
    points: ["og:image meta tag", "Works in any stack", "Invalidate when you need"],
    visual: (
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-workspace font-mono text-xs shadow-panel">
        <div className="flex h-10 items-center gap-1.5 border-b border-border/60 px-4">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-muted-foreground">index.html</span>
        </div>
        <div className="p-5 leading-6">
          <p className="text-muted-foreground">
            <span className="text-warning">&lt;meta</span> property=
            <span className="text-foreground">&quot;og:image&quot;</span> content=
            <span className="text-foreground">&quot;…&#47;v1&#47;og?title=…&quot;</span>
            <span className="text-warning"> /&gt;</span>
          </p>
        </div>
      </div>
    ),
  },
];

export function StoryRows() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {storyRows.map((row) => (
        <motion.div
          key={row.index}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
        >
          <motion.div
            variants={staggerItem}
            className={row.index === "02" ? "lg:order-2" : undefined}
          >
            <div className="icon-box">
              <span className="font-mono text-sm text-primary">{row.index}</span>
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {row.title}
            </h3>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{row.text}</p>
            <ul className="mt-6 space-y-3" role="list">
              {row.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm">
                  <Check className="size-5 text-success flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-muted-foreground/90">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            variants={staggerItem}
            className="transform transition-transform duration-300 group-hover:scale-[1.02]"
          >
            <div className="relative">{row.visual}</div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
