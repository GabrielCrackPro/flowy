export interface Comment {
  id: string;
  userId: string;
  entityType: "transaction" | "goal" | "budget" | "subscription";
  entityId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  entityType: Comment["entityType"];
  entityId: string;
  content: string;
  parentId?: string | null;
}

export interface UpdateCommentInput {
  content: string;
}

export interface CommentFilters {
  entityType: string;
  entityId: string;
}
