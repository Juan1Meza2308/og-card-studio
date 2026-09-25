import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/status")({
  head: () =>
    buildSeo({
      title: "System Status — OGCraft",
      description: "Current availability of OGCraft services.",
      path: "/status",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Status", path: "/status" },
        ]),
      ],
    }),
  component: () => (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Status"
          title="All systems operational."
          text="Image rendering, API delivery, dashboards, and authentication are operating normally."
          icon={CheckCircle2}
        />
      </main>
      <PublicFooter />
    </>
  ),
});
