import { z } from "zod";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { AssistantConversationService } from "@/lib/services/assistant-conversations";

const conversationSchema = z.object({
  title: z.string().max(120).optional(),
});

export const GET = withAuthenticatedRoute({
  routeName: "assistant",
  handler: async ({ auth, request }) => {
    const id = new URL(request.url).searchParams.get("id");
    return Response.json(
      id
        ? await AssistantConversationService.get(auth.id, id)
        : await AssistantConversationService.list(auth.id),
    );
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "assistant",
  handler: async ({ auth, request }) => {
    const body = conversationSchema.parse(
      await request.json().catch(() => ({})),
    );
    return Response.json(
      await AssistantConversationService.create(auth.id, body.title),
    );
  },
});

export const PATCH = withAuthenticatedRoute({
  routeName: "assistant",
  handler: async ({ auth, request }) => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id)
      return Response.json(
        { message: "Conversation id is required" },
        { status: 400 },
      );
    const body = conversationSchema.parse(await request.json());
    await AssistantConversationService.rename(auth.id, id, body.title ?? "");
    return Response.json({ success: true });
  },
});

export const DELETE = withAuthenticatedRoute({
  routeName: "assistant",
  handler: async ({ auth, request }) => {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      await AssistantConversationService.remove(auth.id, id);
    } else {
      await AssistantConversationService.clearAll(auth.id);
    }
    return new Response(null, { status: 204 });
  },
});
