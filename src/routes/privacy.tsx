import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — OGCraft" },
      { name: "description", content: "How OGCraft handles account and API usage data." },
      { property: "og:title", content: "Privacy — OGCraft" },
      { property: "og:description", content: "OGCraft privacy principles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
