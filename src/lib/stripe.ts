import Stripe from "stripe";
import { getValidatedEnv } from "@/lib/env";

/**
 * Server-only Stripe client.
 *
 * Lazily initialized to avoid throwing at module load when the secret key
 * is not configured (e.g. local development without Stripe).
 */
let _stripe: Stripe | null = null;

function createStripeClient(): Stripe | null {
  try {
    const env = getValidatedEnv();
    if (!env.STRIPE_SECRET_KEY) {
      return null;
    }
    return new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  } catch {
    return null;
  }
}

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  _stripe = createStripeClient();
  return _stripe;
}

/**
 * Creates a Checkout Session for subscription upgrades.
 *
 * The session is configured with the user's Supabase ID as metadata so the
 * webhook can associate the subscription with the correct profile.
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  // Find or create the Stripe customer
  let customerId: string | undefined;
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length > 0 && customers.data[0]) {
    customerId = customers.data[0].id;
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      supabase_user_id: userId,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
      },
    },
    allow_promotion_codes: true,
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

/**
 * Creates a Billing Portal session so the user can manage their subscription.
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session | null> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  // Find the customer by metadata on their subscription
  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
  });

  const subscription = subscriptions.data.find(
    (sub) => sub.metadata["supabase_user_id"] === userId && sub.status !== "canceled",
  );

  if (!subscription?.customer) {
    return null;
  }

  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Gets the current plan for a user from Stripe.
 *
 * Returns the plan tier ("free", "pro", "agency") or null if not found.
 */
export async function getUserPlanFromStripe(userId: string): Promise<"free" | "pro" | "agency" | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
  });

  const subscription = subscriptions.data.find(
    (sub) => sub.metadata["supabase_user_id"] === userId && sub.status === "active",
  );

  if (!subscription) return null;

  // Map Stripe price IDs to plan tiers
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return null;

  // These should match the price IDs in the Stripe dashboard
  const priceToPlan: Record<string, "pro" | "agency"> = {
    // Filled in after creating prices in Stripe
    // "price_pro_monthly": "pro",
    // "price_pro_yearly": "pro",
    // "price_agency_monthly": "agency",
    // "price_agency_yearly": "agency",
  };

  return priceToPlan[priceId] ?? null;
}