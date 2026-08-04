import { type NextRequest, NextResponse } from "next/server";

import {
  applyRateLimitHeaders,
  handleApiError,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { billingCycleSchema, createSubscriptionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { SubscriptionService } from "@/lib/services/subscriptions";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "subscription");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const active = searchParams.get("active");
    const billingCycle = searchParams.get("billingCycle");

    const subscriptions = await SubscriptionService.list(auth.id, {
      active: active === null ? undefined : active === "true",
      billingCycle: billingCycle
        ? billingCycleSchema.parse(billingCycle)
        : undefined,
    });

    const response = NextResponse.json(subscriptions);
    return applyRateLimitHeaders(response, auth.id, "subscription");
  } catch (error) {
    return handleApiError(error, "No se pudieron obtener las suscripciones");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(auth.id, "subscription");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = createSubscriptionSchema.parse(await request.json());
    const subscription = await SubscriptionService.create(auth.id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    const response = NextResponse.json(subscription, { status: 201 });
    return applyRateLimitHeaders(response, auth.id, "subscription");
  } catch (error) {
    return handleApiError(error, "Could not create subscription");
  }
}
