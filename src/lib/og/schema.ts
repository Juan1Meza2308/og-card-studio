import { z } from "zod";
import {
  DEFAULT_TEMPLATE,
  DEFAULT_THEME,
  LIMITS,
  TEMPLATE_IDS,
  THEME_IDS,
  type TemplateId,
  type ThemeId,
} from "./constants";

/** Everything the renderer needs, with every field already resolved. */
export type OgRequest = {
  title: string;
  subtitle: string;
  template: TemplateId;
  theme: ThemeId;
};

/**
 * Collapses every run of whitespace into a single space.
 *
 * Two reasons, both about the output rather than about validation: a title
 * carrying newlines or tabs would let a caller reshape the layout, and it
 * would also defeat the length cap, since `"a\n\n\n\n...b"` is short once the
 * breaks are gone.
 */
function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** An absent or blank parameter means "not supplied", not "empty string". */
function blankToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const titleSchema = z.preprocess(
  (value) => (typeof value === "string" ? collapseWhitespace(value) : value),
  z.string().max(LIMITS.titleMaxChars),
);

const subtitleSchema = z.preprocess(
  (value) => (typeof value === "string" ? collapseWhitespace(value) : value),
  z.string().max(LIMITS.subtitleMaxChars),
);

const templateSchema = z.enum(TEMPLATE_IDS);
const themeSchema = z.enum(THEME_IDS);

const rawQuerySchema = z.object({
  title: titleSchema.optional(),
  subtitle: subtitleSchema.optional(),
  template: templateSchema.optional(),
  theme: themeSchema.optional(),
});

export type OgParseFailure = {
  ok: false;
  /** Field name plus reason. Never echoes the submitted value back. */
  issues: Array<{ field: string; reason: string }>;
};

export type OgParseSuccess = { ok: true; value: OgRequest };

export function parseOgRequest(search: URLSearchParams): OgParseSuccess | OgParseFailure {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of search) {
    // Unknown parameters are ignored rather than rejected: a stray UTM tag
    // should not turn a card into an error.
    if (key in rawQuerySchema.shape) raw[key] = blankToUndefined(value);
  }

  const result = rawQuerySchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "query",
        reason: issue.message,
      })),
    };
  }

  return {
    ok: true,
    value: {
      title: result.data.title ?? LIMITS.titleFallback,
      subtitle: result.data.subtitle ?? LIMITS.subtitleFallback,
      template: result.data.template ?? (DEFAULT_TEMPLATE as TemplateId),
      theme: result.data.theme ?? (DEFAULT_THEME as ThemeId),
    },
  };
}
