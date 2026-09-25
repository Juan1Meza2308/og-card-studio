import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Dashboard } from "@/components/ogcraft/dashboard";
import type { View } from "@/components/ogcraft/dashboard";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: z.object({
    view: z.enum(["overview", "keys", "templates", "analytics", "billing"]).catch("overview"),
  }),
  // Private surface: never let it into the index or a share card.
  head: () =>
    buildSeo({
      title: "Dashboard — OGCraft",
      description: "Manage OGCraft usage, API keys, templates, analytics, and billing.",
      path: "/dashboard",
      noindex: true,
    }),
  component: Dashboard,
});

export type DashboardSearch = { view?: View };
