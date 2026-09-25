import type { Database } from "@/integrations/supabase/types";

/** The shape of a template row as returned by the database. */
export type DbTemplate = Database["public"]["Tables"]["templates"]["Row"];

/** The shape accepted by the database on insert. */
export type NewTemplate = Database["public"]["Tables"]["templates"]["Insert"];

/** The shape accepted by the database on update. */
export type TemplateUpdate = Database["public"]["Tables"]["templates"]["Update"];

/**
 * Template that the renderer understands. This is a subset of the DB fields
 * plus the built-in template IDs. A template reference can be either a built-in
 * name (e.g. "tech") or a user-created template UUID.
 */
export type TemplateRef =
  | { kind: "builtin"; id: "tech" | "minimalist" | "dark-gradient" | "clean-white" }
  | { kind: "custom"; id: string };

/**
 * Checks whether a template reference is a built-in template.
 * Built-in templates are always available and don't require auth.
 */
export function isBuiltinTemplate(ref: TemplateRef): ref is TemplateRef & { kind: "builtin" } {
  return ref.kind === "builtin";
}

/**
 * Parses a template reference from a string. Built-in names are recognized;
 * anything that looks like a UUID is treated as a custom template ID.
 * The string is validated against the built-in list first.
 */
export function parseTemplateRef(value: string): TemplateRef | null {
  const builtin = ["tech", "minimalist", "dark-gradient", "clean-white"] as const;
  if (builtin.includes(value as (typeof builtin)[number])) {
    return { kind: "builtin", id: value as (typeof builtin)[number] };
  }
  // UUID v4 pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return { kind: "custom", id: value };
  }
  return null;
}

/**
 * The fields that a custom template can override from the built-in defaults.
 * These correspond to the columns in the `templates` table.
 */
export interface CustomTemplateOverrides {
  theme: "violet" | "ocean" | "ember" | "mint";
  title: string;
  subtitle: string;
  logoUrl?: string | null;
}

/**
 * Builds the complete overrides for a template, merging custom values over
 * the built-in defaults. The built-in templates have their own defaults in
 * `CARD_LAYOUTS` and the palette; this function only provides the user-editable
 * fields (theme, text, logo).
 */
export function resolveTemplateOverrides(
  ref: TemplateRef,
  custom?: Pick<DbTemplate, "theme" | "title" | "subtitle" | "logo_url"> | null,
): CustomTemplateOverrides {
  const defaults: CustomTemplateOverrides = {
    theme: "violet",
    title: "Ship your next idea",
    subtitle: "Built with OGCraft",
    logoUrl: null,
  };

  if (isBuiltinTemplate(ref) || !custom) {
    return defaults;
  }

  return {
    theme: custom.theme as CustomTemplateOverrides["theme"],
    title: custom.title,
    subtitle: custom.subtitle,
    logoUrl: custom.logo_url ?? null,
  };
}