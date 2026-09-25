import { defineEventHandler, readBody, getHeader, createError } from "h3";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for subscription upgrade.
 *
 * Body: { priceId: string }
 * Requires: authenticated user session
 */
export default defineEventHandler(async (event) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const { priceId } = body as { priceId?: string };

  if (!priceId) {
    throw createError({ statusCode: 400, statusMessage: "priceId required" });
  }

  try {
    const session = await createCheckoutSession(
      user.id,
      user.email ?? "",
      priceId,
      `${siteUrl}/dashboard?checkout=success`,
      `${siteUrl}/pricing?checkout=canceled`,
    );

    if (!session?.url) {
      throw createError({ statusCode: 500, statusMessage: "Failed to create checkout session" });
    }

    return { url: session.url };
  } catch (error) {
    console.error("[stripe] checkout failed", error);
    throw createError({ statusCode: 500, statusMessage: "Checkout creation failed" });
  }
});