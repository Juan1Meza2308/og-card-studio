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
import { parseTemplateRef } from "./template";

/** Everything the renderer needs, with every field already resolved. */
export type OgRequest = {
  title: string;
  subtitle: string;
  template: TemplateId;
  theme: ThemeId;
  /** Optional: the user's custom template UUID (when authenticated). */
  templateId: string | undefined;
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
  z.string().max(LIMITS.titleMaxChars, {
    message: `Como maximo ${LIMITS.titleMaxChars} caracteres.`,
  }),
);

const subtitleSchema = z.preprocess(
  (value) => (typeof value === "string" ? collapseWhitespace(value) : value),
  z.string().max(LIMITS.subtitleMaxChars, {
    message: `Como maximo ${LIMITS.subtitleMaxChars} caracteres.`,
  }),
);

// Zod's default enum message quotes the value it rejected, which would put
// caller-controlled text into the response body. Spelling the accepted values
// out is both safer and the more useful error: the caller learns what to use
// rather than only what they sent.
const templateSchema = z.enum(TEMPLATE_IDS, {
  message: `Valores permitidos: ${TEMPLATE_IDS.join(", ")}.`,
});

const themeSchema = z.enum(THEME_IDS, {
  message: `Valores permitidos: ${THEME_IDS.join(", ")}.`,
});

const rawQuerySchema = z.object({
  title: titleSchema.optional(),
  subtitle: subtitleSchema.optional(),
  template: templateSchema.optional(),
  theme: themeSchema.optional(),
  /** Custom template UUID (when authenticated). Must be a valid UUID v4. */
  templateId: z
    .string()
    .uuid({ message: "El templateId debe ser un UUID valido." })
    .optional(),
});

export type OgParseFailure = {
  ok: false;
  /** Field name plus reason. Never echoes the submitted value back. */
  issues: Array<{ field: string; reason: string }>;
};

export type OgParseSuccess = { ok: true; value: OgRequest };

/**
 * Upper bound on a reason, so a schema message that grows long later cannot
 * turn a 400 into an arbitrary-size response. The messages in this file are
 * fixed strings well under the cap; this only bounds the failure mode.
 */
const MAX_REASON_CHARS = 200;

function describeIssue(issue: { path: (string | number)[]; message: string }) {
  const reason = issue.message.slice(0, MAX_REASON_CHARS);
  return { field: issue.path.join(".") || "query", reason };
}

export function parseOgRequest(search: URLSearchParams): OgParseSuccess | OgParseFailure {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of search) {
    // Unknown parameters are ignored rather than rejected: a stray UTM tag
    // should not turn a card into an error.
    if (key in rawQuerySchema.shape) raw[key] = blankToUndefined(value);
  }

  const result = rawQuerySchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, issues: result.error.issues.map(describeIssue) };
  }

  return {
    ok: true,
    value: {
      title: result.data.title ?? LIMITS.titleFallback,
      subtitle: result.data.subtitle ?? LIMITS.subtitleFallback,
      template: result.data.template ?? (DEFAULT_TEMPLATE as TemplateId),
      theme: result.data.theme ?? (DEFAULT_THEME as ThemeId),
      templateId: result.data.templateId,
    },
  };
}
