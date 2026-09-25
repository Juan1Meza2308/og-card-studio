import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    buildSeo({
      title: "Privacy — OGCraft",
      description: "How OGCraft handles account and API usage data.",
      path: "/privacy",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ]),
      ],
    }),
  component: () => (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Privacy"
          title="Your data stays yours."
          text="We collect only the account and usage data needed to operate OGCraft. API keys are stored as one-way hashes and never shown again after creation."
        />
      </main>
      <PublicFooter />
    </>
  ),
});
