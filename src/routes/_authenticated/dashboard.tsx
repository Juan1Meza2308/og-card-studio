import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/ogcraft/dashboard";
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OGCraft" },
      {
        name: "description",
        content: "Manage OGCraft usage, API keys, templates, analytics, and billing.",
      },
      { property: "og:title", content: "Dashboard — OGCraft" },
      { property: "og:description", content: "Your OGCraft developer workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});
