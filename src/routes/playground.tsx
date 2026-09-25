import { createFileRoute } from "@tanstack/react-router";
import { Playground } from "@/components/ogcraft/playground";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/playground")({
  head: () =>
    buildSeo({
      title: "Playground — OGCraft",
      description: "Design and download an Open Graph preview image instantly.",
      path: "/playground",
      imageAlt: "OGCraft playground — build a social card and copy its API URL",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Playground", path: "/playground" },
        ]),
      ],
    }),
  component: PlaygroundPage,
});
function PlaygroundPage() {
  return (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Live editor"
          title="Craft your next social preview."
          text="Tune the content and style, then copy a production-ready URL."
        />
        <section className="mx-auto max-w-6xl px-5 pb-24 pt-12" aria-labelledby="editor-heading">
          <h2 id="editor-heading" className="sr-only">
            Open Graph image editor
          </h2>
          <Playground />
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
