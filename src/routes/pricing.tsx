import { createFileRoute } from "@tanstack/react-router";
import {
  PRICING_FAQ,
  PageIntro,
  PricingGrid,
  PublicFooter,
  PublicNav,
} from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo, faqPageJsonLd, softwareApplicationJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    buildSeo({
      title: "Pricing — OGCraft",
      description:
        "Simple OGCraft plans for personal projects, products, and agencies. Start with 100 free images each month and scale when ready.",
      path: "/pricing",
      jsonLd: [
        softwareApplicationJsonLd(),
        faqPageJsonLd(PRICING_FAQ),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]),
      ],
    }),
  component: Pricing,
});
function Pricing() {
  return (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Simple plans"
          title="Pricing that scales with your reach."
          text="No setup fees, no long contracts, and a generous free tier for your next project."
        />
        <section className="section-shell pt-16" aria-labelledby="plans-heading">
          <h2 id="plans-heading" className="sr-only">
            Plans: Free, Pro, and Agency
          </h2>
          <PricingGrid />
        </section>
        <section className="section-shell border-t border-border/70" aria-labelledby="faq-heading">
          <h2
            id="faq-heading"
            className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Questions before you pick a plan.
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {PRICING_FAQ.map((entry) => (
              <div key={entry.question} className="border-t border-border/60 pt-6">
                <h3 className="text-base font-semibold leading-snug">{entry.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
