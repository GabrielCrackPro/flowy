-- CreateTable
CREATE TABLE "assistant_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_conversation_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_conversations_user_id_updated_at_idx" ON "assistant_conversations"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "assistant_conversations_space_id_updated_at_idx" ON "assistant_conversations"("space_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "assistant_conversation_messages_conversation_id_created_at_idx" ON "assistant_conversation_messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_conversation_messages" ADD CONSTRAINT "assistant_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
