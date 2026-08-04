import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/user";
import { billingCycleSchema, createSubscriptionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";
import { SubscriptionService } from "@/lib/services/subscriptions";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const active = searchParams.get("active");
    const billingCycle = searchParams.get("billingCycle");

    const subscriptions = await SubscriptionService.list(user.id, {
      active: active === null ? undefined : active === "true",
      billingCycle: billingCycle
        ? billingCycleSchema.parse(billingCycle)
        : undefined,
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "No se pudieron obtener las suscripciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSubscriptionSchema.parse(await request.json());
    const subscription = await SubscriptionService.create(user.id, body);

    await AlertsService.evaluateForUser(user.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Could not create subscription" },
      { status: 500 },
    );
  }
}
