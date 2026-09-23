import { motion } from "motion/react";
import { Globe2, ImageIcon, Timer } from "lucide-react";
import { spring, staggerItem } from "@/lib/motion";

function OgCard({
  theme,
  template,
  title,
  category,
  className = "",
}: {
  theme: string;
  template: string;
  title: string;
  category: string;
  className?: string;
}) {
  return (
    <div
      className={`og-preview ${theme} ${template} rounded-xl shadow-[0_2px_8px_-2px_rgb(0,0,0,0.3)] ${className}`}
    >
      <div className="og-grid" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col justify-between p-[7%]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="grid size-6 place-items-center rounded-md bg-white/10">
              <ImageIcon className="size-3.5" />
            </span>
            <span className="text-[clamp(10px,1vw,14px)]">OGCraft</span>
          </div>
          <span className="font-mono text-[clamp(8px,0.7vw,11px)] opacity-60">ogcraft.dev</span>
        </div>
        <div>
          <p className="mb-2 font-mono text-[clamp(9px,0.9vw,13px)] uppercase text-white/80">
            {category}
          </p>
          <p className="text-[clamp(16px,1.9vw,28px)] font-semibold leading-[1.05] text-white">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[clamp(8px,0.7vw,11px)] text-white/70">
          <Globe2 className="size-[1em]" /> Generated in 42ms
        </div>
      </div>
    </div>
  );
}

const chips = [
  { label: "42ms", icon: Timer, className: "-top-3 -left-2 sm:-left-4" },
  { label: "200 OK", icon: Globe2, className: "top-1/4 -right-2 sm:-right-6" },
  { label: "og:image", icon: ImageIcon, className: "-bottom-3 left-6 sm:left-10" },
];

export function HeroShowcase() {
  return (
    <motion.div
      variants={staggerItem}
      className="relative mx-auto w-full max-w-md lg:max-w-none"
      aria-hidden="true"
    >
      {/* Back card — ocean, rotated left */}
      <motion.div
        initial={{ opacity: 0, x: -36, rotate: 0 }}
        animate={{ opacity: 1, x: 0, rotate: -7 }}
        transition={{ ...spring.gentle, delay: 0.35 }}
        className="absolute inset-0"
      >
        <OgCard
          theme="og-ocean"
          template="og-dark-gradient"
          title="Launch from the edge."
          category="API · EDGE · CACHE"
          className="translate-x-[-8%] translate-y-[6%] scale-[0.94]"
        />
      </motion.div>
      {/* Back card — ember, rotated right */}
      <motion.div
        initial={{ opacity: 0, x: 36, rotate: 0 }}
        animate={{ opacity: 1, x: 0, rotate: 7 }}
        transition={{ ...spring.gentle, delay: 0.42 }}
        className="absolute inset-0"
      >
        <OgCard
          theme="og-ember"
          template="og-minimalist"
          title="Made for the open web."
          category="ONE URL · EVERY CARD"
          className="translate-x-[8%] translate-y-[-4%] scale-[0.94]"
        />
      </motion.div>
      {/* Front card — violet, on top */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring.gentle, delay: 0.5 }}
        className="relative"
      >
        <OgCard
          theme="og-violet"
          template="og-tech"
          title="Ship ideas people remember."
          category="ENGINEERING · PRODUCT · DESIGN"
        />
      </motion.div>

      {/* Floating metadata chips */}
      {chips.map((chip, i) => (
        <motion.span
          key={chip.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.snappy, delay: 0.75 + i * 0.1 }}
          className={`absolute inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/85 px-2.5 py-1 font-mono text-[10px] text-muted-foreground shadow-[0_1px_3px_rgb(0,0,0,0.15)] backdrop-blur-sm ${chip.className}`}
        >
          <chip.icon className="size-3 text-primary" />
          {chip.label}
        </motion.span>
      ))}
    </motion.div>
  );
}
