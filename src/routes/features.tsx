import { createFileRoute } from "@tanstack/react-router";
import {
  CtaBand,
  FeatureGrid,
  PageIntro,
  PublicFooter,
  PublicNav,
} from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () =>
    buildSeo({
      title: "Features — OGCraft",
      description:
        "Explore OGCraft's edge rendering, templates, caching, and framework integrations.",
      path: "/features",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ]),
      ],
    }),
  component: Features,
});
function Features() {
  return (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Platform"
          title="A focused API for every social image."
          text="From one-off launches to millions of pages, OGCraft keeps your previews sharp, consistent, and fast."
        />
        <section className="section-shell pt-16">
          <h2 className="sr-only">Everything OGCraft does for your social previews</h2>
          <FeatureGrid />
        </section>
        <CtaBand />
      </main>
      <PublicFooter />
    </>
  );
}
