import { Link } from "@tanstack/react-router";
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
              <Link to={item.to} className="px-3 py-2 rounded-md text-sm font-medium hover:text-foreground transition-colors">
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
            <Button className="mt-1 w-full justify-center px-4 py-3 text-sm font-medium rounded-lg" asChild>
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
        <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureItems.map((item, index) => (
          <article
            key={item.title}
            className="group relative rounded-2xl border border-border/60 bg-card/50 p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_rgb(99,102,241,0.15)] hover:shadow-glow"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="icon-box group-hover:scale-110 transition-transform duration-300">
              <item.icon className="size-6 text-primary" strokeWidth={2} />
            </div>
            <h3 className="mt-5 font-semibold text-lg leading-tight">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
          </article>
        ))}
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Free",
    price: "$0",
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
    price: "$12",
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
    price: "$39",
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
  return (
    <section className="relative" aria-labelledby="pricing-heading">
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <article
            key={plan.name}
            className={`relative rounded-2xl border p-7 transition-all duration-300 ${
              plan.popular
                ? "border-primary/30 bg-primary/5 shadow-glow ring-1 ring-primary/10"
                : "border-border/60 bg-card/50 hover:border-primary/20"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
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
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
              </div>
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
          </article>
        ))}
      </div>
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
    <div className="mx-auto max-w-3xl pt-20 text-center animate-fade-up">
      <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 font-mono text-[10px] uppercase text-primary">
        <Icon className="size-3.5" strokeWidth={2} />
        {eyebrow}
      </span>
      <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-wrap-balance">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{text}</p>
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="relative border-t border-border/40" aria-labelledby="cta-heading">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 sm:flex-row sm:items-center">
        <div className="animate-fade-up">
          <p className="font-mono text-xs uppercase text-primary">Ready to ship</p>
          <h2 id="cta-heading" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            One URL. Every social card.
          </h2>
        </div>
        <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <Button size="lg" asChild className="gap-2">
            <Link to="/auth" className="flex items-center gap-2">
              Start free — 100 images/mo
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link to="/playground" className="flex items-center gap-2">
              <Image className="size-4" />
              Try playground
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}