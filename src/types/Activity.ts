export interface Activity {
  id: string;
  userId: string;
  actorId: string | null;
  type: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityFilters {
  type?: string;
  entityType?: string;
  limit?: number;
  cursor?: string;
}
