import { brandCardUrl } from "@/lib/og/url";
import { siteUrl } from "@/lib/site";
import type { DetailedHTMLProps, MetaHTMLAttributes } from "react";

/**
 * Shape TanStack Router's `head()` expects for a meta tag. The runtime also
 * accepts a `{ "script:ld+json": ... }` entry (see headContentUtils), but that
 * variant is missing from the published type, so the widening cast is confined
 * to buildSeo instead of being repeated in every route.
 */
type HeadMeta = DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>;

/** Every card is a 1200×630 Open Graph image — the size X, Slack and LinkedIn render. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * The site's own share image is served by the site's own endpoint.
 *
 * Shipping a hand-made static PNG here would mean the product's homepage
 * advertises a renderer it does not use, and the one place a broken endpoint
 * would go unnoticed is the one place everyone looks first. The `/v1` prefix
 * keeps it cacheable forever, and the endpoint is derived from `siteUrl` so it
 * points at whichever deployment is answering.
 */
const DEFAULT_OG_IMAGE = brandCardUrl(siteUrl);
const TWITTER_SITE = "@juan1meza2308";

export type SeoInput = {
  /** Full document title, brand suffix included. */
  title: string;
  description: string;
  /** Absolute path on this site. Used for both canonical and og:url. */
  path: string;
  /** Absolute URL of the share image. Defaults to the site's own rendered card. */
  image?: string;
  imageAlt?: string;
  /** Keeps private routes out of the index and out of link equity. */
  noindex?: boolean;
  /** Structured data graph nodes to embed as ld+json. */
  jsonLd?: Record<string, unknown>[];
};

type SeoResult = {
  meta: HeadMeta[];
  links: { rel: string; href: string }[];
};

function absolute(path: string): string {
  return path.startsWith("/") ? `${siteUrl}${path}` : `${siteUrl}/${path}`;
}

/**
 * Builds the full metadata block for a route. Every route goes through this so a
 * page can never inherit another page's canonical or og:url by accident.
 */
export function buildSeo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt = `${title} — OGCraft`,
  noindex = false,
  jsonLd = [],
}: SeoInput): SeoResult {
  const url = absolute(path);

  const meta: HeadMeta[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "OGCraft" },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: image },
    { property: "og:image:width", content: String(OG_IMAGE_WIDTH) },
    { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_SITE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  for (const node of jsonLd) {
    meta.push({ "script:ld+json": node } as unknown as HeadMeta);
  }

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}

const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;

/** Publisher identity, emitted once from the root route. */
export const organizationJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "OGCraft",
  url: `${siteUrl}/`,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/favicon.svg`,
    width: 512,
    height: 512,
  },
};

/** Site-level node with the search action box. */
export const webSiteJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${siteUrl}/`,
  name: "OGCraft",
  publisher: { "@id": ORGANIZATION_ID },
  inLanguage: "en-US",
};

export type PlanId = "free" | "pro" | "agency";

export const PLAN_PRICING: Record<PlanId, { price: string; priceYearly: string }> = {
  free: { price: "0", priceYearly: "0" },
  pro: { price: "12", priceYearly: "9" },
  agency: { price: "39", priceYearly: "32" },
};

/** Product graph with one Offer per plan, so pricing is machine readable. */
export function softwareApplicationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: "OGCraft",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/`,
    description:
      "API that renders customizable Open Graph images from a single URL, cached at the edge.",
    offers: (Object.keys(PLAN_PRICING) as PlanId[]).map((id) => ({
      "@type": "Offer",
      name: `${id.charAt(0).toUpperCase()}${id.slice(1)} plan`,
      price: PLAN_PRICING[id].price,
      priceCurrency: "USD",
      category: "subscription",
      url: `${siteUrl}/pricing`,
      availability: "https://schema.org/InStock",
    })),
  };
}

export type FaqEntry = { question: string; answer: string };

/**
 * FAQPage graph. Google requires the exact question/answer text to be visible on
 * the page, so pass the same strings the UI renders.
 */
export function faqPageJsonLd(entries: readonly FaqEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Ordered trail back to the home page. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}
