import {
  handleApiError,
  isAuthResponse,
  noContent,
  requireAuth,
} from "@/lib/api/route-utils";
import { SubscriptionService } from "@lib/services/subscriptions";
import { type NextRequest, NextResponse } from "next/server";
import { updateSubscriptionSchema } from "@/lib/schemas";
import { AlertsService } from "@/lib/services/alerts";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const subscription = await SubscriptionService.get(auth.id, id);

    if (!subscription) {
      return NextResponse.json(
        { message: "Suscripción no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    return handleApiError(error, "Could not get subscription");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    const body = updateSubscriptionSchema.parse(await request.json());
    const subscription = await SubscriptionService.update(auth.id, id, body);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return NextResponse.json(subscription);
  } catch (error) {
    return handleApiError(error, "Could not update subscription");
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();

  if (isAuthResponse(auth)) {
    return auth;
  }

  try {
    await SubscriptionService.delete(auth.id, id);

    await AlertsService.evaluateForUser(auth.id).catch((error) => {
      console.error("Failed to evaluate alerts:", error);
    });

    return noContent();
  } catch (error) {
    return handleApiError(error, "Could not delete subscription");
  }
}
