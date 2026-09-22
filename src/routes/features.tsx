import { createFileRoute } from "@tanstack/react-router";
import {
  CtaBand,
  FeatureGrid,
  PageIntro,
  PublicFooter,
  PublicNav,
} from "@/components/ogcraft/marketing";
export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — OGCraft" },
      {
        name: "description",
        content:
          "Explore OGCraft's edge rendering, templates, caching, and framework integrations.",
      },
      { property: "og:title", content: "Features — OGCraft" },
      {
        property: "og:description",
        content: "Everything developers need to generate consistent social images.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Features,
});
function Features() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen">
        <PageIntro
          eyebrow="Platform"
          title="A focused API for every social image."
          text="From one-off launches to millions of pages, OGCraft keeps your previews sharp, consistent, and fast."
        />
        <section className="section-shell pt-16">
          <FeatureGrid />
        </section>
        <CtaBand />
      </main>
      <PublicFooter />
    </>
  );
}
