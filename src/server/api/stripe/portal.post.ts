import { defineEventHandler, createError } from "h3";
import { supabase } from "@/integrations/supabase/client";
import { createPortalSession } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session for subscription management.
 *
 * Requires: authenticated user session
 */
export default defineEventHandler(async (event) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  try {
    const session = await createPortalSession(user.id, `${siteUrl}/dashboard`);

    if (!session?.url) {
      throw createError({ statusCode: 404, statusMessage: "No active subscription found" });
    }

    return { url: session.url };
  } catch (error) {
    console.error("[stripe] portal failed", error);
    throw createError({ statusCode: 500, statusMessage: "Portal creation failed" });
  }
});