import { defineEventHandler, readRawBody, getHeader, createError } from "h3";
import { getServiceClient } from "@/lib/og/server-auth";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";
import { getValidatedEnv } from "@/lib/env";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 *
 * Events handled:
 * - checkout.session.completed: subscription created
 * - customer.subscription.updated: plan changed
 * - customer.subscription.deleted: subscription canceled
 * - invoice.payment_failed: payment failed
 */
export default defineEventHandler(async (event) => {
  const stripe = getStripe();
  if (!stripe) {
    throw createError({ statusCode: 500, statusMessage: "Stripe not configured" });
  }

  const signature = getHeader(event, "stripe-signature");
  const body = await readRawBody(event);
  if (!signature || !body) {
    throw createError({ statusCode: 400, statusMessage: "Missing signature or body" });
  }

  let stripeEvent: Stripe.Event;
  try {
    const webhookSecret = getValidatedEnv().STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("[stripe] webhook secret not configured, skipping verification");
      stripeEvent = JSON.parse(body.toString()) as Stripe.Event;
    } else {
      stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err) {
    console.error("[stripe] webhook signature verification failed", err);
    throw createError({ statusCode: 400, statusMessage: "Webhook signature verification failed" });
  }

  const client = getServiceClient();
  if (!client) {
    throw createError({ statusCode: 500, statusMessage: "Service role not configured" });
  }

  const env = getValidatedEnv();

  function mapPriceToPlan(priceId: string): "free" | "pro" | "agency" | null {
    if (priceId === env.STRIPE_PRICE_PRO_MONTHLY || priceId === env.STRIPE_PRICE_PRO_YEARLY) {
      return "pro";
    }
    if (priceId === env.STRIPE_PRICE_AGENCY_MONTHLY || priceId === env.STRIPE_PRICE_AGENCY_YEARLY) {
      return "agency";
    }
    return null;
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.["supabase_user_id"];
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.warn("[stripe] checkout.session.completed missing user_id");
          break;
        }

        // Get the subscription to find the price
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
          console.warn("[stripe] subscription missing price id");
          break;
        }
        const plan = mapPriceToPlan(priceId);

        if (plan) {
          await client.from("profiles").update({ plan }).eq("id", userId);
          console.log(`[stripe] user ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.["supabase_user_id"];

        if (!userId) {
          console.warn("[stripe] subscription.updated missing user_id");
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
          console.warn("[stripe] subscription missing price id");
          break;
        }
        const plan = mapPriceToPlan(priceId) ?? "free";

        await client.from("profiles").update({ plan }).eq("id", userId);
        console.log(`[stripe] user ${userId} plan updated to ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.["supabase_user_id"];

        if (!userId) {
          console.warn("[stripe] subscription.deleted missing user_id");
          break;
        }

        await client.from("profiles").update({ plan: "free" }).eq("id", userId);
        console.log(`[stripe] user ${userId} downgraded to free`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.["supabase_user_id"];

          if (userId) {
            console.warn(`[stripe] payment failed for user ${userId}`);
            // Could downgrade to free or mark as past_due here
          }
        }
        break;
      }

      default:
        console.log(`[stripe] unhandled event type: ${stripeEvent.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error("[stripe] webhook handler error", error);
    throw createError({ statusCode: 500, statusMessage: "Webhook handler error" });
  }
});

function mapPriceToPlan(priceId: string, env: ReturnType<typeof getValidatedEnv>): "free" | "pro" | "agency" | null {
  if (priceId === env.STRIPE_PRICE_PRO_MONTHLY || priceId === env.STRIPE_PRICE_PRO_YEARLY) {
    return "pro";
  }
  if (priceId === env.STRIPE_PRICE_AGENCY_MONTHLY || priceId === env.STRIPE_PRICE_AGENCY_YEARLY) {
    return "agency";
  }
  return null;
}