import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BookOpen, Braces, Terminal } from "lucide-react";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";
import { LIMITS, TEMPLATE_IDS, THEME_IDS } from "@/lib/og/constants";
import { OG_IMAGE_PATH } from "@/lib/og/url";
import { siteUrl } from "@/lib/site";

const SECTIONS = [
  { href: "#request", label: "First request" },
  { href: "#parameters", label: "Parameters" },
  { href: "#response", label: "Response" },
  { href: "#errors", label: "Errors" },
  { href: "#caching", label: "Caching" },
  { href: "#auth", label: "Authentication" },
] as const;

/** Shown verbatim in the quick start, so the example is the real request. */
const QUICK_START = `curl "${siteUrl}${OG_IMAGE_PATH}?title=Hello%20World&theme=violet" \\
  --output og.png`;

type ParameterDoc = { name: string; type: string; text: string };

/**
 * Built from the same constants the schema validates with, so the table cannot
 * document a limit the endpoint does not enforce, or omit one it does.
 */
const PARAMETERS: ParameterDoc[] = [
  {
    name: "title",
    type: `string, ≤ ${LIMITS.titleMaxChars} chars`,
    text: `The headline. Blank or missing falls back to “${LIMITS.titleFallback}”. Whitespace runs are collapsed.`,
  },
  {
    name: "subtitle",
    type: `string, ≤ ${LIMITS.subtitleMaxChars} chars`,
    text: `A supporting line under the headline. Blank or missing falls back to “${LIMITS.subtitleFallback}”.`,
  },
  {
    name: "template",
    type: TEMPLATE_IDS.join(" | "),
    text: "Layout of the card. Defaults to the first in the list.",
  },
  {
    name: "theme",
    type: THEME_IDS.join(" | "),
    text: "Colourway of the card. Defaults to the first in the list.",
  },
];

const ERRORS: { status: string; when: string }[] = [
  {
    status: "400",
    when: "A parameter failed validation. The body names the field and the reason, never the value you sent.",
  },
  { status: "405", when: "Method other than GET or HEAD. The response carries an Allow header." },
  {
    status: "414",
    when: `The query string is longer than ${LIMITS.queryStringMaxChars} characters, checked before any parsing.`,
  },
  {
    status: "500",
    when: "The renderer itself failed. The response is a fixed body; the detail goes to the server log, not to you.",
  },
];

export const Route = createFileRoute("/docs")({
  head: () =>
    buildSeo({
      title: "API Documentation — OGCraft",
      description:
        "Integrate OGCraft dynamic social images with HTML, Next.js, or any HTTP client.",
      path: "/docs",
      imageAlt: "OGCraft API documentation — your quick-start guide to the image API",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
        ]),
      ],
    }),
  component: Docs,
});

function Docs() {
  return (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Documentation"
          title="From zero to your first image."
          text="Build a URL, fetch it, and use the result anywhere an image URL is accepted."
          icon={BookOpen}
        />
        <section className="mx-auto grid max-w-5xl gap-6 px-5 pb-24 pt-16 md:grid-cols-[220px_1fr]">
          <aside className="h-fit border-l border-border pl-4 text-sm">
            <p className="mb-3 font-medium">Getting started</p>
            {SECTIONS.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="block py-1.5 text-muted-foreground first:text-primary"
              >
                {section.label}
              </a>
            ))}
          </aside>

          <article className="min-w-0">
            <section id="request">
              <p className="eyebrow">
                <Terminal /> Quick start
              </p>
              <h2 className="mt-4 text-2xl font-semibold">Create an image</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A GET request to the image endpoint returns a 1200×630 PNG. No key, no body, no
                redirect — the URL is the whole API.
              </p>
              <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-code p-5 font-mono text-xs leading-6 text-code-foreground">
                <code>{QUICK_START}</code>
              </pre>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The result goes straight into an <code className="text-primary">og:image</code> tag:
              </p>
              <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-code p-5 font-mono text-xs leading-6 text-code-foreground">
                <code>{`<meta property="og:image" content="${siteUrl}${OG_IMAGE_PATH}?title=Hello%20World" />`}</code>
              </pre>
            </section>

            <section id="parameters" className="mt-12 border-t border-border pt-10">
              <p className="eyebrow">
                <Braces /> Parameters
              </p>
              <div className="mt-5 space-y-4">
                {PARAMETERS.map((param) => (
                  <div
                    key={param.name}
                    className="grid gap-1 border-b border-border/60 pb-4 sm:grid-cols-[150px_1fr]"
                  >
                    <div>
                      <code className="text-sm text-primary">{param.name}</code>
                      <p className="text-xs text-muted-foreground">{param.type}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{param.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Unknown parameters are ignored, so a stray UTM tag will not turn a card into an
                error. Percent-encode the values: the URL ends up inside an HTML attribute.
              </p>
            </section>

            <section id="response" className="mt-12 border-t border-border pt-10">
              <h2 className="text-2xl font-semibold">Response</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <code className="text-primary">200</code> with{" "}
                <code className="text-primary">content-type: image/png</code> and the image bytes.{" "}
                <code className="text-primary">HEAD</code> is accepted and returns the same headers
                with no body, which is what you want for a probe.
              </p>
            </section>

            <section id="errors" className="mt-12 border-t border-border pt-10">
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <AlertTriangle className="size-5 text-muted-foreground" aria-hidden />
                Errors
              </h2>
              <div className="mt-5 space-y-4">
                {ERRORS.map((error) => (
                  <div
                    key={error.status}
                    className="grid gap-1 border-b border-border/60 pb-4 sm:grid-cols-[60px_1fr]"
                  >
                    <code className="text-sm text-primary">{error.status}</code>
                    <p className="text-sm text-muted-foreground">{error.when}</p>
                  </div>
                ))}
              </div>
              <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-code p-5 font-mono text-xs leading-6 text-code-foreground">
                <code>{`{ "error": "invalid_request",
  "issues": [ { "field": "title", "reason": "…" } ] }`}</code>
              </pre>
            </section>

            <section id="caching" className="mt-12 border-t border-border pt-10">
              <h2 className="text-2xl font-semibold">Caching</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Successful responses are immutable and cached at the edge for a year. That is safe
                because the <code className="text-primary">{OG_IMAGE_PATH}</code> prefix pins the
                design version: when the cards change, this path becomes{" "}
                <code className="text-primary">/v2/og</code> and every URL already shared keeps
                rendering the picture it was promised. A card URL is therefore a stable asset, not a
                live view — put it in your markup once and it keeps working.
              </p>
            </section>

            <section id="auth" className="mt-12 border-t border-border pt-10">
              <h2 className="text-2xl font-semibold">Authentication</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                There is no API key yet. The endpoint is open, and the protections that are actually
                in place are input caps and the edge cache — the string lengths above and the
                query-length limit are the real limits, not a quota.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Keys arrive with the dashboard. When they do, the header above stays the same, and
                this section will say so instead of describing a key you cannot use yet.
              </p>
            </section>
          </article>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
