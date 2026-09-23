"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const labels = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  const currentIcon = icons[theme];
  const currentLabel = labels[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Current theme: ${currentLabel}. Click to change.`}
        >
          <currentIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">{currentLabel} mode</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {(["light", "dark", "system"] as const).map((t) => {
            const Icon = icons[t];
            return (
              <DropdownMenuRadioItem key={t} value={t} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{labels[t]}</span>
                </div>
                {theme === t && <Check className="size-4 text-primary" strokeWidth={3} />}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
