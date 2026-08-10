/**
 * Generates `public/openapi.json` — the OpenAPI 3.1 specification for the
 * Flowy REST API.
 *
 * - Request-body schemas are derived from the Zod schemas in
 *   `src/lib/schemas` via `schema.toJSON()`, so they can never drift from
 *   validation.
 * - Operation metadata (paths, methods, query params, auth, rate limits,
 *   responses) lives in the route inventory below. The drift guard
 *   `scripts/check-openapi-routes.mjs` fails CI when a route handler is added
 *   or removed without the spec being updated in step.
 *
 * Run with: `pnpm generate:openapi` (tsx). Output is committed.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createBudgetSchema,
  createCategorySchema,
  createCommentSchema,
  createGoalSchema,
  createSubscriptionSchema,
  createTransactionSchema,
  updateBudgetSchema,
  updateCategorySchema,
  updateCommentSchema,
  updateGoalSchema,
  updateProfileSchema,
  updateSubscriptionSchema,
  updateThemeSchema,
  updateTransactionSchema,
} from "@/lib/schemas";

// The spec version is deliberately decoupled from the app's package.json
// version: release-please bumps package.json on every release, and the CI
// drift guard would otherwise fail those release PRs (regenerated spec != the
// committed one). Bump this only when the API contract itself changes.
const API_VERSION = "1.0.0";

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "openapi.json",
);

type Json = Record<string, unknown>;

/**
 * Convert a Zod object schema to a plain JSON Schema object.
 *
 * Walks the schema's public `.shape`, converting every field with Zod v4
 * `.toJSONSchema()`. Zod refuses to represent `z.coerce.date()` leaves
 * ("Date cannot be represented in JSON Schema"), so the date-only fields
 * below are documented as `format: "date"` — they are sent over the wire as
 * ISO date strings. Required-ness comes from `isOptional()`.
 */
const DATE_FIELDS = new Set(["date", "deadline", "nextPayment"]);

function jsObject(schema: {
  shape?: Record<string, { isOptional?(): boolean; toJSONSchema?(): unknown }>;
  toJSONSchema?(): unknown;
}): Json {
  const shape = schema.shape;
  if (!shape) {
    return clean(schema.toJSONSchema?.() ?? {}) as Json;
  }
  const properties: Json = {};
  const required: string[] = [];
  for (const [key, field] of Object.entries(shape)) {
    if (DATE_FIELDS.has(key)) {
      properties[key] = { type: "string", format: "date" };
    } else {
      try {
        properties[key] = clean(field.toJSONSchema?.() ?? {}) as Json;
      } catch (error) {
        throw new Error(
          `Cannot convert field "${key}" to JSON Schema: ${(error as Error).message}`,
        );
      }
    }
    if (!field.isOptional?.()) required.push(key);
  }
  const result: Json = { type: "object", properties };
  if (required.length) result.required = required;
  return result;
}

/** Strip Zod-specific artifacts that are not valid OpenAPI. */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (key === "$schema" || key === "$defs" || key === "error") continue;
      out[key] = clean(entry);
    }
    return out;
  }
  return value;
}

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` });
const nullable = (name: string): Json => ({
  anyOf: [ref(name), { type: "null" }],
});

const jsonBody = (schema: Json): Json => ({
  required: true,
  content: { "application/json": { schema } },
});

const reqBody = (name: string): Json => jsonBody(ref(name));

// --- Shared response helpers -------------------------------------------------

const RESPONSES = {
  BadRequest: {
    description:
      "Invalid request — body failed Zod validation or query parameters are invalid.",
    content: { "application/json": { schema: ref("Error") } },
  },
  Unauthorized: {
    description:
      "Missing or invalid authentication. Authenticate with the Supabase session cookie or `Authorization: Bearer <access_token>`.",
    content: { "application/json": { schema: ref("Error") } },
  },
  Forbidden: {
    description:
      "The authenticated user is not allowed to perform this action.",
    content: { "application/json": { schema: ref("Error") } },
  },
  NotFound: {
    description: "The requested entity does not exist in the active space.",
    content: { "application/json": { schema: ref("Error") } },
  },
  Conflict: {
    description:
      "The request conflicts with existing data (e.g. duplicate name).",
    content: { "application/json": { schema: ref("Error") } },
  },
  RateLimited: {
    description:
      "Rate limit exceeded. Retry after the `Retry-After` header. Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` describe the window.",
    headers: {
      "Retry-After": {
        description: "Seconds to wait before retrying",
        schema: { type: "integer" },
      },
      "X-RateLimit-Limit": {
        description: "Requests allowed per window",
        schema: { type: "integer" },
      },
      "X-RateLimit-Remaining": {
        description: "Requests remaining in the window",
        schema: { type: "integer" },
      },
      "X-RateLimit-Reset": {
        description: "ISO timestamp when the window resets",
        schema: { type: "string", format: "date-time" },
      },
    },
    content: { "application/json": { schema: ref("RateLimitError") } },
  },
  ServerError: {
    description: "Unexpected server error.",
    content: { "application/json": { schema: ref("Error") } },
  },
};

const SESSION_AUTH: Json[] = [{ bearerAuth: [] }];
const NO_AUTH: Json[] = [];

const UUID = ref("Uuid");

const ID_PARAM: Json = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: "Entity UUID",
};

function qp(name: string, schema: Json, description?: string): Json {
  return { name, in: "query", schema, description };
}

function responses(
  ok: Json,
  opts: {
    notFound?: boolean;
    conflict?: boolean;
    forbidden?: boolean;
    rateLimited?: boolean;
  } = {},
): Json {
  return {
    ...ok,
    400: { $ref: "#/components/responses/BadRequest" },
    401: { $ref: "#/components/responses/Unauthorized" },
    ...(opts.forbidden
      ? { 403: { $ref: "#/components/responses/Forbidden" } }
      : {}),
    ...(opts.notFound
      ? { 404: { $ref: "#/components/responses/NotFound" } }
      : {}),
    ...(opts.conflict
      ? { 409: { $ref: "#/components/responses/Conflict" } }
      : {}),
    ...(opts.rateLimited
      ? { 429: { $ref: "#/components/responses/RateLimited" } }
      : {}),
    500: { $ref: "#/components/responses/ServerError" },
  };
}

function op(input: {
  operationId: string;
  summary: string;
  description?: string;
  tags: string[];
  security?: Json[];
  parameters?: Json[];
  requestBody?: Json;
  responses: Json;
  rateLimit?: string;
}): Json {
  const operation: Json = {
    operationId: input.operationId,
    summary: input.summary,
    tags: input.tags,
    security: input.security ?? SESSION_AUTH,
    responses: input.responses,
  };
  if (input.description) operation.description = input.description;
  if (input.parameters?.length) operation.parameters = input.parameters;
  if (input.requestBody) operation.requestBody = input.requestBody;
  if (input.rateLimit) operation["x-flowy-rate-limit"] = input.rateLimit;
  return operation;
}

// --- Component schemas -------------------------------------------------------

const paginated = (itemName: string): Json => ({
  type: "object",
  properties: {
    data: { type: "array", items: ref(itemName) },
    total: { type: "integer", description: "Total rows matching the filters" },
    page: { type: "integer", description: "Current page (1-based)" },
    limit: { type: "integer", description: "Page size" },
    totalPages: { type: "integer" },
  },
  required: ["data", "total", "page", "limit", "totalPages"],
});

const BASE_FIELDS = {
  id: UUID,
  userId: UUID,
  spaceId: { type: ["string", "null"], format: "uuid" },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
  updatedBy: { type: ["string", "null"], format: "uuid" },
};

const schemas: Record<string, Json> = {
  Uuid: { type: "string", format: "uuid" },
  ProfileIdentity: {
    type: "object",
    description: "Lightweight profile summary embedded in owned entities.",
    properties: {
      id: UUID,
      name: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      avatarUrl: { type: ["string", "null"] },
    },
  },
  Category: {
    type: "object",
    properties: {
      ...BASE_FIELDS,
      name: { type: "string" },
      icon: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
      type: { type: "string", enum: ["INCOME", "EXPENSE"] },
      user: ref("ProfileIdentity"),
      updatedByProfile: nullable("ProfileIdentity"),
    },
    required: ["id", "userId", "name", "type", "createdAt", "updatedAt"],
  },
  Transaction: {
    type: "object",
    properties: {
      ...BASE_FIELDS,
      type: { type: "string", enum: ["INCOME", "EXPENSE"] },
      amount: { type: "number", description: "Decimal amount" },
      description: { type: ["string", "null"] },
      paymentMethod: {
        type: ["string", "null"],
        enum: [
          "CASH",
          "CARD",
          "BANK_TRANSFER",
          "BIZUM",
          "PAYPAL",
          "OTHER",
          null,
        ],
      },
      date: { type: ["string", "null"], format: "date" },
      notes: { type: ["string", "null"] },
      receiptUrl: { type: ["string", "null"] },
      isRecurring: { type: "boolean" },
      budgetId: { type: ["string", "null"], format: "uuid" },
      tags: {
        type: "array",
        items: ref("Category"),
        description: "Categories applied to the transaction",
      },
      user: ref("ProfileIdentity"),
      updatedByProfile: nullable("ProfileIdentity"),
      budget: nullable("BudgetSummary"),
    },
    required: [
      "id",
      "userId",
      "type",
      "amount",
      "isRecurring",
      "tags",
      "createdAt",
      "updatedAt",
    ],
  },
  BudgetSummary: {
    type: "object",
    description: "Budget attached to a transaction.",
    properties: {
      id: UUID,
      categoryId: UUID,
      budgetLimit: { type: "number" },
      month: { type: ["integer", "null"] },
      year: { type: ["integer", "null"] },
      category: ref("Category"),
    },
  },
  Budget: {
    type: "object",
    description:
      "Budget row with computed expenses/income/remaining for its month.",
    properties: {
      ...BASE_FIELDS,
      categoryId: UUID,
      budgetLimit: { type: "number" },
      month: { type: ["integer", "null"], minimum: 1, maximum: 12 },
      year: { type: ["integer", "null"] },
      expenses: { type: "number" },
      income: { type: "number" },
      remaining: { type: "number" },
      category: ref("Category"),
      user: ref("ProfileIdentity"),
      updatedByProfile: nullable("ProfileIdentity"),
    },
    required: [
      "id",
      "userId",
      "categoryId",
      "budgetLimit",
      "expenses",
      "income",
      "remaining",
      "createdAt",
      "updatedAt",
    ],
  },
  Goal: {
    type: "object",
    properties: {
      ...BASE_FIELDS,
      title: { type: "string" },
      targetAmount: { type: "number" },
      savedAmount: { type: "number" },
      deadline: { type: ["string", "null"], format: "date" },
      user: ref("ProfileIdentity"),
      updatedByProfile: nullable("ProfileIdentity"),
    },
    required: [
      "id",
      "userId",
      "title",
      "targetAmount",
      "savedAmount",
      "createdAt",
      "updatedAt",
    ],
  },
  Subscription: {
    type: "object",
    properties: {
      ...BASE_FIELDS,
      merchant: { type: ["string", "null"] },
      amount: { type: ["number", "null"] },
      billingCycle: {
        type: ["string", "null"],
        enum: ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", null],
      },
      nextPayment: { type: ["string", "null"], format: "date" },
      active: { type: "boolean" },
      user: ref("ProfileIdentity"),
      updatedByProfile: nullable("ProfileIdentity"),
    },
    required: ["id", "userId", "active", "createdAt", "updatedAt"],
  },
  Comment: {
    type: "object",
    properties: {
      id: UUID,
      userId: UUID,
      spaceId: { type: ["string", "null"], format: "uuid" },
      entityType: {
        type: "string",
        enum: ["transaction", "goal", "budget", "subscription"],
      },
      entityId: UUID,
      parentId: { type: ["string", "null"], format: "uuid" },
      content: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "userId",
      "entityType",
      "entityId",
      "content",
      "createdAt",
      "updatedAt",
    ],
  },
  Activity: {
    type: "object",
    properties: {
      id: UUID,
      userId: UUID,
      spaceId: { type: ["string", "null"], format: "uuid" },
      actorId: { type: ["string", "null"], format: "uuid" },
      type: {
        type: "string",
        description: "Activity type, e.g. transaction.created",
      },
      entityType: { type: ["string", "null"] },
      entityId: { type: ["string", "null"], format: "uuid" },
      metadata: { type: ["object", "null"], additionalProperties: true },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "userId", "type", "createdAt"],
  },
  SpaceMember: {
    type: "object",
    properties: {
      id: UUID,
      spaceId: UUID,
      userId: UUID,
      role: { type: "string", enum: ["owner", "member"] },
      joinedAt: { type: "string", format: "date-time" },
      user: ref("ProfileIdentity"),
    },
  },
  Space: {
    type: "object",
    properties: {
      id: UUID,
      name: { type: "string" },
      slug: { type: ["string", "null"] },
      joinCode: {
        type: ["string", "null"],
        description: "Invite code used to join a shared space",
      },
      ownerId: UUID,
      isPersonal: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      members: { type: "array", items: ref("SpaceMember") },
    },
    required: ["id", "name", "ownerId", "isPersonal", "createdAt", "updatedAt"],
  },
  Alert: {
    type: "object",
    properties: {
      id: UUID,
      userId: UUID,
      spaceId: { type: ["string", "null"], format: "uuid" },
      type: { type: "string" },
      severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
      fingerprint: { type: "string" },
      title: { type: "string" },
      description: { type: ["string", "null"] },
      data: { type: ["object", "null"], additionalProperties: true },
      sentAt: { type: ["string", "null"], format: "date-time" },
      readAt: { type: ["string", "null"], format: "date-time" },
      resolvedAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "userId",
      "type",
      "severity",
      "fingerprint",
      "title",
      "createdAt",
    ],
  },
  Profile: {
    type: "object",
    properties: {
      id: UUID,
      email: { type: ["string", "null"] },
      name: { type: ["string", "null"] },
      avatarUrl: { type: ["string", "null"] },
      currency: { type: "string" },
      locale: { type: "string" },
      showLanguageSelector: { type: "boolean" },
      activeSpaceId: { type: ["string", "null"], format: "uuid" },
      dashboardCards: { type: ["array", "null"], items: { type: "string" } },
      primaryColor: { type: ["string", "null"] },
      secondaryColor: { type: ["string", "null"] },
      accentColor: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "currency", "locale", "createdAt"],
  },
  DailyStatsPoint: {
    type: "object",
    properties: {
      day: { type: "integer" },
      income: { type: "number" },
      expenses: { type: "number" },
      balance: { type: "number" },
    },
  },
  ExpenseCategoryStat: {
    type: "object",
    properties: { name: { type: "string" }, amount: { type: "number" } },
  },
  DashboardStats: {
    type: "object",
    properties: {
      balance: { type: "number" },
      incomeThisMonth: { type: "number" },
      expensesThisMonth: { type: "number" },
      savingsRate: { type: "number" },
      prevIncome: { type: "number" },
      prevExpenses: { type: "number" },
      prevSavingsRate: { type: "number" },
      activeSubscriptions: { type: "integer" },
      activeBudgets: { type: "integer" },
      dailySeries: { type: "array", items: ref("DailyStatsPoint") },
      expensesByCategory: { type: "array", items: ref("ExpenseCategoryStat") },
    },
  },
  BudgetWithSpent: {
    type: "object",
    description: "Budget with the amount actually spent so far.",
    allOf: [{ $ref: "#/components/schemas/Budget" }],
    properties: { spent: { type: "number" } },
  },
  DashboardData: {
    type: "object",
    properties: {
      stats: ref("DashboardStats"),
      recentTransactions: { type: "array", items: ref("Transaction") },
      budgets: { type: "array", items: ref("BudgetWithSpent") },
      goals: { type: "array", items: ref("Goal") },
      subscriptions: { type: "array", items: ref("Subscription") },
      activities: { type: "array", items: ref("Activity") },
    },
  },
  SearchResultItem: {
    type: "object",
    properties: {
      id: UUID,
      type: {
        type: "string",
        enum: ["transaction", "category", "budget", "goal", "subscription"],
      },
      title: { type: "string" },
      subtitle: { type: ["string", "null"] },
      url: { type: "string" },
      amount: { type: "number" },
    },
    required: ["id", "type", "title", "subtitle", "url"],
  },
  SearchResponse: {
    type: "object",
    properties: {
      query: { type: "string" },
      results: { type: "array", items: ref("SearchResultItem") },
      total: { type: "integer" },
    },
    required: ["query", "results", "total"],
  },
  NotificationsResponse: {
    type: "object",
    properties: {
      alerts: { type: "array", items: ref("Alert") },
      unreadCount: { type: "integer" },
    },
    required: ["alerts", "unreadCount"],
  },
  HealthResponse: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["healthy"] },
      database: { type: "string", enum: ["connected"] },
      timestamp: { type: "string", format: "date-time" },
    },
  },
  HealthErrorResponse: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["unhealthy"] },
      database: { type: "string", enum: ["disconnected"] },
      error: { type: "string" },
      timestamp: { type: "string", format: "date-time" },
    },
  },
  Error: {
    type: "object",
    description:
      "Uniform error envelope. `category` is one of the ErrorCategory values in src/lib/errors/error-types.ts (validation, authentication, authorization, not_found, rate_limit, database, service_unavailable, network, server, unknown).",
    properties: {
      message: { type: "string" },
      category: { type: "string" },
      severity: { type: ["string", "null"] },
      statusCode: { type: ["integer", "null"] },
      isRetryable: { type: "boolean" },
      errors: {
        type: ["array", "null"],
        items: { type: "object", additionalProperties: true },
        description: "Zod validation issues (message + errors only on 400s)",
      },
      retryAfter: {
        type: ["integer", "null"],
        description: "Seconds until the rate-limit window resets",
      },
      retryAt: { type: ["string", "null"], format: "date-time" },
    },
    required: ["message"],
  },
  RateLimitError: {
    type: "object",
    description:
      "429 response body. Include `Retry-After` in the next request.",
    properties: {
      message: { type: "string" },
      retryAfter: { type: "integer" },
      retryAt: { type: "string", format: "date-time" },
      category: { type: "string" },
      isRetryable: { type: "boolean" },
    },
  },
  SuccessResponse: {
    type: "object",
    properties: { success: { type: "boolean" } },
    required: ["success"],
  },
  DeleteAccountResponse: {
    type: "object",
    properties: { message: { type: "string" } },
  },
  BulkDeleteRequest: {
    type: "object",
    properties: {
      action: { type: "string", const: "bulkDelete" },
      ids: {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1,
        maxItems: 100,
      },
    },
    required: ["action", "ids"],
  },
  BulkDeleteResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      deletedCount: { type: "integer" },
    },
    required: ["success", "deletedCount"],
  },
  CreateSpaceRequest: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: 'Defaults to "Nuevo espacio" when omitted',
      },
      isPersonal: { type: "boolean", default: false },
    },
  },
  JoinSpaceRequest: {
    type: "object",
    properties: {
      action: { type: "string", const: "join" },
      joinCode: {
        type: "string",
        description: "Space invite code (case-insensitive)",
      },
    },
    required: ["action", "joinCode"],
  },
  SpaceActionRequest: {
    type: "object",
    description:
      "Action-based space update. Only the fields for the chosen action are read: setActive → none; rename → name, isPersonal; leave → none; removeMember → memberUserId.",
    properties: {
      action: {
        type: "string",
        enum: ["setActive", "rename", "leave", "removeMember"],
      },
      name: { type: "string" },
      isPersonal: { type: "boolean" },
      memberUserId: { type: "string", format: "uuid" },
    },
    required: ["action"],
  },
  SetActiveSpaceResponse: {
    type: "object",
    properties: { activeSpaceId: { type: ["string", "null"], format: "uuid" } },
  },
  MarkNotificationsReadRequest: {
    type: "object",
    properties: {
      ids: { type: "array", items: { type: "string", format: "uuid" } },
      all: {
        type: "boolean",
        description:
          "Mark every unread alert as read (takes precedence over ids)",
      },
    },
  },
  CreatePushSubscriptionRequest: {
    type: "object",
    description: "Web Push subscription (PushManager.subscribe output).",
    properties: {
      endpoint: { type: "string", format: "uri" },
      p256dh: { type: "string" },
      auth: { type: "string" },
    },
    required: ["endpoint", "p256dh", "auth"],
  },
  DeletePushSubscriptionRequest: {
    type: "object",
    properties: { endpoint: { type: "string", format: "uri" } },
    required: ["endpoint"],
  },
  PushSubscriptionResponse: {
    type: "object",
    properties: {
      ok: { type: "boolean" },
      id: { type: "string", format: "uuid" },
    },
    required: ["ok", "id"],
  },
  ChangePasswordRequest: {
    type: "object",
    properties: {
      currentPassword: { type: "string" },
      newPassword: { type: "string", minLength: 8 },
    },
    required: ["currentPassword", "newPassword"],
  },
  UploadResponse: {
    type: "object",
    properties: { url: { type: "string", format: "uri" } },
    required: ["url"],
  },
  CronAlertsResponse: {
    type: "object",
    properties: {
      users: { type: "integer", description: "Profiles evaluated" },
      created: { type: "integer", description: "Alerts created" },
      pushed: { type: "integer", description: "Push notifications sent" },
    },
    required: ["users", "created", "pushed"],
  },
  // --- Zod-derived request schemas (single source of truth) ---
  CreateTransactionRequest: jsObject(createTransactionSchema),
  UpdateTransactionRequest: jsObject(updateTransactionSchema),
  CreateBudgetRequest: jsObject(createBudgetSchema),
  UpdateBudgetRequest: jsObject(updateBudgetSchema),
  CreateCategoryRequest: jsObject(createCategorySchema),
  UpdateCategoryRequest: jsObject(updateCategorySchema),
  CreateGoalRequest: jsObject(createGoalSchema),
  UpdateGoalRequest: jsObject(updateGoalSchema),
  CreateSubscriptionRequest: jsObject(createSubscriptionSchema),
  UpdateSubscriptionRequest: jsObject(updateSubscriptionSchema),
  CreateCommentRequest: jsObject(createCommentSchema),
  UpdateCommentRequest: jsObject(updateCommentSchema),
  UpdateProfileRequest: jsObject(updateProfileSchema),
  UpdateThemeRequest: jsObject(updateThemeSchema),
};

// --- Route inventory ---------------------------------------------------------

const ENUM_TYPES = {
  type: { type: "string", enum: ["INCOME", "EXPENSE"] },
  paymentMethod: {
    type: "string",
    enum: ["CASH", "CARD", "BANK_TRANSFER", "BIZUM", "PAYPAL", "OTHER"],
  },
  billingCycle: {
    type: "string",
    enum: ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"],
  },
  sortBy: { type: "string", enum: ["date", "amount", "description", "type"] },
  sortOrder: { type: "string", enum: ["asc", "desc"] },
  entityType: {
    type: "string",
    enum: ["transaction", "goal", "budget", "subscription"],
  },
  bool: { type: "string", enum: ["true", "false"] },
};

const RATE = {
  default: "150 requests / 120s (default window)",
  entity: "20 requests / 120s",
  comment: "30 requests / 120s",
  dashboard: "30 requests / 120s",
  profile: "30 requests / 120s",
  search: "40 requests / 120s",
  stats: "50 requests / 120s",
};

const paths: Record<string, Json> = {};

// --- Transactions ---
paths["/api/transaction"] = {
  get: op({
    operationId: "transactions.list",
    summary: "List transactions",
    description:
      "Paginated, filterable list of transactions in the active space. Rate-limited per user.",
    tags: ["Transactions"],
    parameters: [
      qp("type", ENUM_TYPES.type),
      qp(
        "categoryId",
        { type: "string" },
        "Comma-separated category UUIDs; matches transactions tagged with any of them",
      ),
      qp("paymentMethod", ENUM_TYPES.paymentMethod),
      qp("from", { type: "string", format: "date" }),
      qp("to", { type: "string", format: "date" }),
      qp(
        "search",
        { type: "string" },
        "Case-insensitive match on description or notes",
      ),
      qp("isRecurring", ENUM_TYPES.bool),
      qp("page", { type: "integer", minimum: 1, default: 1 }),
      qp("limit", { type: "integer", minimum: 1, maximum: 100, default: 50 }),
      qp("sortBy", ENUM_TYPES.sortBy),
      qp("sortOrder", ENUM_TYPES.sortOrder),
    ],
    responses: responses(
      {
        200: {
          description: "Paginated transactions",
          content: { "application/json": { schema: paginated("Transaction") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  post: op({
    operationId: "transactions.create",
    summary: "Create a transaction",
    description:
      'Creates a transaction in the active space, or performs a bulk delete when `action: "bulkDelete"` is sent.',
    tags: ["Transactions"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            oneOf: [ref("CreateTransactionRequest"), ref("BulkDeleteRequest")],
          },
        },
      },
    },
    responses: responses(
      {
        201: {
          description: "Created transaction",
          content: { "application/json": { schema: ref("Transaction") } },
        },
        200: {
          description: "Bulk delete result",
          content: {
            "application/json": { schema: ref("BulkDeleteResponse") },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

paths["/api/transaction/{id}"] = {
  get: op({
    operationId: "transactions.get",
    summary: "Get a transaction",
    tags: ["Transactions"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Transaction",
          content: { "application/json": { schema: ref("Transaction") } },
        },
      },
      { notFound: true, rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  patch: op({
    operationId: "transactions.update",
    summary: "Update a transaction",
    description: "Partial update — only provided fields are changed.",
    tags: ["Transactions"],
    parameters: [ID_PARAM],
    requestBody: reqBody("UpdateTransactionRequest"),
    responses: responses(
      {
        200: {
          description: "Updated transaction",
          content: { "application/json": { schema: ref("Transaction") } },
        },
      },
      { notFound: true, rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  delete: op({
    operationId: "transactions.delete",
    summary: "Delete a transaction",
    tags: ["Transactions"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true, rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

// --- Budgets ---
paths["/api/budget"] = {
  get: op({
    operationId: "budgets.list",
    summary: "List budgets",
    tags: ["Budgets"],
    parameters: [
      qp("categoryId", { type: "string", format: "uuid" }),
      qp("month", { type: "integer", minimum: 1, maximum: 12 }),
      qp("year", { type: "integer", minimum: 2000, maximum: 2100 }),
    ],
    responses: responses(
      {
        200: {
          description:
            "Paginated budgets with computed expenses/income/remaining",
          content: { "application/json": { schema: paginated("Budget") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  post: op({
    operationId: "budgets.create",
    summary: "Create a budget",
    tags: ["Budgets"],
    requestBody: reqBody("CreateBudgetRequest"),
    responses: responses(
      {
        201: {
          description: "Created budget",
          content: { "application/json": { schema: ref("Budget") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

paths["/api/budget/{id}"] = {
  get: op({
    operationId: "budgets.get",
    summary: "Get a budget",
    tags: ["Budgets"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Budget with computed figures",
          content: { "application/json": { schema: ref("Budget") } },
        },
      },
      { notFound: true },
    ),
  }),
  patch: op({
    operationId: "budgets.update",
    summary: "Update a budget",
    tags: ["Budgets"],
    parameters: [ID_PARAM],
    requestBody: reqBody("UpdateBudgetRequest"),
    responses: responses(
      {
        200: {
          description: "Updated budget",
          content: { "application/json": { schema: ref("Budget") } },
        },
      },
      { notFound: true },
    ),
  }),
  delete: op({
    operationId: "budgets.delete",
    summary: "Delete a budget",
    tags: ["Budgets"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true },
    ),
  }),
};

// --- Categories ---
paths["/api/category"] = {
  get: op({
    operationId: "categories.list",
    summary: "List categories",
    description: "All categories in the active space, sorted by name.",
    tags: ["Categories"],
    responses: responses(
      {
        200: {
          description: "Categories",
          content: {
            "application/json": {
              schema: { type: "array", items: ref("Category") },
            },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  post: op({
    operationId: "categories.create",
    summary: "Create a category",
    tags: ["Categories"],
    requestBody: reqBody("CreateCategoryRequest"),
    responses: responses(
      {
        201: {
          description: "Created category",
          content: { "application/json": { schema: ref("Category") } },
        },
      },
      { conflict: true, rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

paths["/api/category/{id}"] = {
  get: op({
    operationId: "categories.get",
    summary: "Get a category",
    tags: ["Categories"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Category",
          content: { "application/json": { schema: ref("Category") } },
        },
      },
      { notFound: true },
    ),
  }),
  patch: op({
    operationId: "categories.update",
    summary: "Update a category",
    tags: ["Categories"],
    parameters: [ID_PARAM],
    requestBody: reqBody("UpdateCategoryRequest"),
    responses: responses(
      {
        200: {
          description: "Updated category",
          content: { "application/json": { schema: ref("Category") } },
        },
      },
      { notFound: true, conflict: true },
    ),
  }),
  delete: op({
    operationId: "categories.delete",
    summary: "Delete a category",
    tags: ["Categories"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true },
    ),
  }),
};

// --- Goals ---
paths["/api/goal"] = {
  get: op({
    operationId: "goals.list",
    summary: "List goals",
    tags: ["Goals"],
    parameters: [
      qp(
        "completed",
        ENUM_TYPES.bool,
        "Filter by whether savedAmount >= targetAmount",
      ),
    ],
    responses: responses(
      {
        200: {
          description: "Paginated goals",
          content: { "application/json": { schema: paginated("Goal") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  post: op({
    operationId: "goals.create",
    summary: "Create a goal",
    tags: ["Goals"],
    requestBody: reqBody("CreateGoalRequest"),
    responses: responses(
      {
        201: {
          description: "Created goal",
          content: { "application/json": { schema: ref("Goal") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

paths["/api/goal/{id}"] = {
  get: op({
    operationId: "goals.get",
    summary: "Get a goal",
    tags: ["Goals"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Goal",
          content: { "application/json": { schema: ref("Goal") } },
        },
      },
      { notFound: true },
    ),
  }),
  patch: op({
    operationId: "goals.update",
    summary: "Update a goal",
    tags: ["Goals"],
    parameters: [ID_PARAM],
    requestBody: reqBody("UpdateGoalRequest"),
    responses: responses(
      {
        200: {
          description: "Updated goal",
          content: { "application/json": { schema: ref("Goal") } },
        },
      },
      { notFound: true },
    ),
  }),
  delete: op({
    operationId: "goals.delete",
    summary: "Delete a goal",
    tags: ["Goals"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true },
    ),
  }),
};

// --- Subscriptions ---
paths["/api/subscription"] = {
  get: op({
    operationId: "subscriptions.list",
    summary: "List subscriptions",
    tags: ["Subscriptions"],
    parameters: [
      qp("active", ENUM_TYPES.bool),
      qp("billingCycle", ENUM_TYPES.billingCycle),
    ],
    responses: responses(
      {
        200: {
          description: "Paginated subscriptions",
          content: {
            "application/json": { schema: paginated("Subscription") },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
  post: op({
    operationId: "subscriptions.create",
    summary: "Create a subscription",
    tags: ["Subscriptions"],
    requestBody: reqBody("CreateSubscriptionRequest"),
    responses: responses(
      {
        201: {
          description: "Created subscription",
          content: { "application/json": { schema: ref("Subscription") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

paths["/api/subscription/{id}"] = {
  get: op({
    operationId: "subscriptions.get",
    summary: "Get a subscription",
    tags: ["Subscriptions"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Subscription",
          content: { "application/json": { schema: ref("Subscription") } },
        },
      },
      { notFound: true },
    ),
  }),
  patch: op({
    operationId: "subscriptions.update",
    summary: "Update a subscription",
    tags: ["Subscriptions"],
    parameters: [ID_PARAM],
    requestBody: reqBody("UpdateSubscriptionRequest"),
    responses: responses(
      {
        200: {
          description: "Updated subscription",
          content: { "application/json": { schema: ref("Subscription") } },
        },
      },
      { notFound: true },
    ),
  }),
  delete: op({
    operationId: "subscriptions.delete",
    summary: "Delete a subscription",
    tags: ["Subscriptions"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true },
    ),
  }),
};

// --- Comments ---
paths["/api/comment"] = {
  get: op({
    operationId: "comments.list",
    summary: "List comments for an entity",
    tags: ["Comments"],
    parameters: [
      qp("entityType", ENUM_TYPES.entityType, "Required"),
      qp(
        "entityId",
        { type: "string", format: "uuid" },
        "Required — the parent entity UUID",
      ),
    ],
    responses: responses(
      {
        200: {
          description: "Comments (oldest first)",
          content: {
            "application/json": {
              schema: { type: "array", items: ref("Comment") },
            },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.comment,
  }),
  post: op({
    operationId: "comments.create",
    summary: "Create a comment",
    tags: ["Comments"],
    requestBody: reqBody("CreateCommentRequest"),
    responses: responses(
      {
        201: {
          description: "Created comment",
          content: { "application/json": { schema: ref("Comment") } },
        },
      },
      { notFound: true, rateLimited: true },
    ),
    rateLimit: RATE.comment,
  }),
};

paths["/api/comment/{id}"] = {
  patch: op({
    operationId: "comments.update",
    summary: "Update a comment",
    tags: ["Comments"],
    parameters: [ID_PARAM],
    requestBody: reqBody("UpdateCommentRequest"),
    responses: responses(
      {
        200: {
          description: "Updated comment",
          content: { "application/json": { schema: ref("Comment") } },
        },
      },
      { notFound: true },
    ),
  }),
  delete: op({
    operationId: "comments.delete",
    summary: "Delete a comment",
    tags: ["Comments"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true },
    ),
  }),
};

// --- Activity ---
paths["/api/activity"] = {
  get: op({
    operationId: "activity.list",
    summary: "List activity feed",
    tags: ["Activity"],
    parameters: [
      qp("limit", { type: "integer", minimum: 1, maximum: 50, default: 15 }),
      qp("type", { type: "string" }, "e.g. transaction.created"),
      qp("entityType", { type: "string" }),
    ],
    responses: responses(
      {
        200: {
          description: "Recent activity (newest first)",
          content: {
            "application/json": {
              schema: { type: "array", items: ref("Activity") },
            },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.default,
  }),
  delete: op({
    operationId: "activity.clear",
    summary: "Clear activity feed",
    tags: ["Activity"],
    responses: responses(
      {
        200: {
          description: "Number of deleted entries",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { deletedCount: { type: "integer" } },
                required: ["deletedCount"],
              },
            },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.default,
  }),
};

// --- Spaces ---
paths["/api/space"] = {
  get: op({
    operationId: "spaces.list",
    summary: "List spaces",
    description: "All spaces the user owns or is a member of, with members.",
    tags: ["Spaces"],
    responses: responses({
      200: {
        description: "Spaces",
        content: {
          "application/json": {
            schema: { type: "array", items: ref("Space") },
          },
        },
      },
    }),
  }),
  post: op({
    operationId: "spaces.create",
    summary: "Create or join a space",
    description:
      'Creates a space, or joins one when `action: "join"` with a join code is sent.',
    tags: ["Spaces"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            oneOf: [ref("CreateSpaceRequest"), ref("JoinSpaceRequest")],
          },
        },
      },
    },
    responses: responses({
      201: {
        description: "Created or joined space",
        content: { "application/json": { schema: ref("Space") } },
      },
    }),
  }),
};

paths["/api/space/{id}"] = {
  get: op({
    operationId: "spaces.get",
    summary: "Get a space",
    tags: ["Spaces"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Space",
          content: { "application/json": { schema: ref("Space") } },
        },
      },
      { notFound: true },
    ),
  }),
  patch: op({
    operationId: "spaces.update",
    summary: "Update a space",
    description:
      "Action-based: `setActive` switches the user's active space, `rename` renames it (owner only), `leave` leaves/deletes it, `removeMember` removes a member (owner only).",
    tags: ["Spaces"],
    parameters: [ID_PARAM],
    requestBody: reqBody("SpaceActionRequest"),
    responses: responses(
      {
        200: {
          description: "Result — space, activeSpaceId, or success",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  ref("Space"),
                  ref("SetActiveSpaceResponse"),
                  ref("SuccessResponse"),
                ],
              },
            },
          },
        },
      },
      { notFound: true, forbidden: true },
    ),
  }),
  delete: op({
    operationId: "spaces.delete",
    summary: "Delete a space",
    description: "Owner only; the last remaining space cannot be deleted.",
    tags: ["Spaces"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Deleted",
          content: { "application/json": { schema: ref("SuccessResponse") } },
        },
      },
      { notFound: true, forbidden: true },
    ),
  }),
};

// --- Dashboard / stats / search ---
paths["/api/dashboard"] = {
  get: op({
    operationId: "dashboard.get",
    summary: "Get dashboard data",
    tags: ["Dashboard"],
    parameters: [
      qp("month", { type: "integer", minimum: 1, maximum: 12 }),
      qp("year", { type: "integer", minimum: 2000, maximum: 2100 }),
    ],
    responses: responses(
      {
        200: {
          description: "Dashboard aggregates and recent data",
          content: { "application/json": { schema: ref("DashboardData") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.dashboard,
  }),
};

paths["/api/stats"] = {
  get: op({
    operationId: "stats.get",
    summary: "Get dashboard statistics",
    tags: ["Stats"],
    parameters: [
      qp("month", { type: "integer", minimum: 1, maximum: 12 }),
      qp("year", { type: "integer", minimum: 2000, maximum: 2100 }),
    ],
    responses: responses(
      {
        200: {
          description: "Monthly statistics",
          content: { "application/json": { schema: ref("DashboardStats") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.stats,
  }),
};

paths["/api/search"] = {
  get: op({
    operationId: "search.query",
    summary: "Search across entities",
    description:
      "Searches transactions, categories, budgets, goals and subscriptions in the active space. Queries shorter than 2 characters return an empty result.",
    tags: ["Search"],
    parameters: [qp("q", { type: "string", minLength: 2 }, "Search query")],
    responses: responses(
      {
        200: {
          description: "Search results",
          content: { "application/json": { schema: ref("SearchResponse") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.search,
  }),
};

// --- Profile ---
paths["/api/profile"] = {
  post: op({
    operationId: "profiles.ensure",
    summary: "Ensure the user's profile exists",
    description:
      "Creates the profile row if missing (idempotent). Returns 201 on creation, 200 if it already existed.",
    tags: ["Profile"],
    responses: responses(
      {
        200: {
          description: "Existing profile",
          content: { "application/json": { schema: ref("Profile") } },
        },
        201: {
          description: "Profile created",
          content: { "application/json": { schema: ref("Profile") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.profile,
  }),
};

paths["/api/profile/{id}"] = {
  get: op({
    operationId: "profiles.get",
    summary: "Get a profile",
    tags: ["Profile"],
    parameters: [ID_PARAM],
    responses: responses(
      {
        200: {
          description: "Profile",
          content: { "application/json": { schema: ref("Profile") } },
        },
      },
      { notFound: true },
    ),
  }),
  patch: op({
    operationId: "profiles.update",
    summary: "Update a profile",
    description:
      "Sends the profile fields, or the theme fields (primaryColor/secondaryColor/accentColor).",
    tags: ["Profile"],
    parameters: [ID_PARAM],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            oneOf: [ref("UpdateProfileRequest"), ref("UpdateThemeRequest")],
          },
        },
      },
    },
    responses: responses(
      {
        200: {
          description: "Updated profile",
          content: { "application/json": { schema: ref("Profile") } },
        },
      },
      { notFound: true },
    ),
  }),
  delete: op({
    operationId: "profiles.delete",
    summary: "Delete a profile",
    tags: ["Profile"],
    parameters: [ID_PARAM],
    responses: responses(
      { 204: { description: "Deleted" } },
      { notFound: true },
    ),
  }),
};

// --- Notifications ---
paths["/api/notifications"] = {
  get: op({
    operationId: "notifications.list",
    summary: "List alerts",
    description:
      "Alerts for the active space (up to 50) plus the unread count.",
    tags: ["Notifications"],
    responses: responses({
      200: {
        description: "Alerts and unread count",
        content: {
          "application/json": { schema: ref("NotificationsResponse") },
        },
      },
    }),
  }),
};

paths["/api/notifications/read"] = {
  post: op({
    operationId: "notifications.markRead",
    summary: "Mark alerts as read",
    tags: ["Notifications"],
    requestBody: reqBody("MarkNotificationsReadRequest"),
    responses: responses({
      200: {
        description: "Marked",
        content: { "application/json": { schema: ref("SuccessResponse") } },
      },
    }),
  }),
};

// --- Push subscriptions ---
paths["/api/push-subscription"] = {
  post: op({
    operationId: "pushSubscriptions.create",
    summary: "Register a Web Push subscription",
    description:
      "Upserts the subscription for the authenticated user. 409 when the endpoint already belongs to another user.",
    tags: ["Push"],
    requestBody: reqBody("CreatePushSubscriptionRequest"),
    responses: responses(
      {
        200: {
          description: "Registered",
          content: {
            "application/json": { schema: ref("PushSubscriptionResponse") },
          },
        },
      },
      { conflict: true },
    ),
  }),
  delete: op({
    operationId: "pushSubscriptions.delete",
    summary: "Unregister a Web Push subscription",
    tags: ["Push"],
    requestBody: reqBody("DeletePushSubscriptionRequest"),
    responses: responses({
      200: {
        description: "Removed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { ok: { type: "boolean" } },
              required: ["ok"],
            },
          },
        },
      },
    }),
  }),
};

// --- Uploads ---
paths["/api/upload"] = {
  post: op({
    operationId: "uploads.receipt",
    summary: "Upload a transaction receipt",
    description:
      "Multipart/form-data with a `file` field. Returns the public URL of the stored receipt.",
    tags: ["Uploads"],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: { file: { type: "string", format: "binary" } },
            required: ["file"],
          },
        },
      },
    },
    responses: responses({
      200: {
        description: "Uploaded file URL",
        content: { "application/json": { schema: ref("UploadResponse") } },
      },
    }),
  }),
};

paths["/api/upload/avatar"] = {
  post: op({
    operationId: "uploads.avatar",
    summary: "Upload a profile avatar",
    description:
      "Multipart/form-data with a `file` field. Returns the public URL of the stored avatar.",
    tags: ["Uploads"],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: { file: { type: "string", format: "binary" } },
            required: ["file"],
          },
        },
      },
    },
    responses: responses({
      200: {
        description: "Uploaded file URL",
        content: { "application/json": { schema: ref("UploadResponse") } },
      },
    }),
  }),
};

// --- Account ---
paths["/api/account"] = {
  delete: op({
    operationId: "account.delete",
    summary: "Delete the account",
    description:
      "Permanently deletes the user's data (cascade) and the Supabase auth user.",
    tags: ["Account"],
    responses: responses(
      {
        200: {
          description: "Account deleted",
          content: {
            "application/json": { schema: ref("DeleteAccountResponse") },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.entity,
  }),
};

paths["/api/account/password"] = {
  post: op({
    operationId: "account.changePassword",
    summary: "Change password",
    description: "Verifies the current password, then updates it.",
    tags: ["Account"],
    requestBody: reqBody("ChangePasswordRequest"),
    responses: responses({
      200: {
        description: "Password changed",
        content: {
          "application/json": { schema: ref("DeleteAccountResponse") },
        },
      },
    }),
  }),
};

// --- Cron & health ---
paths["/api/cron/alerts"] = {
  post: op({
    operationId: "cron.alerts",
    summary: "Evaluate alerts for all users (cron)",
    description:
      "Internal endpoint. Authenticates with `Authorization: Bearer <CRON_SECRET>`. Evaluates alert rules for every profile and sends push notifications.",
    tags: ["Cron"],
    security: [{ cronAuth: [] }],
    responses: {
      200: {
        description: "Evaluation summary",
        content: { "application/json": { schema: ref("CronAlertsResponse") } },
      },
      401: { $ref: "#/components/responses/Unauthorized" },
      500: { $ref: "#/components/responses/ServerError" },
    },
  }),
};

paths["/api/health"] = {
  get: op({
    operationId: "health.check",
    summary: "Health check",
    description: "Public. Verifies the database connection.",
    tags: ["System"],
    security: NO_AUTH,
    responses: {
      200: {
        description: "Healthy",
        content: { "application/json": { schema: ref("HealthResponse") } },
      },
      503: {
        description: "Database unreachable",
        content: { "application/json": { schema: ref("HealthErrorResponse") } },
      },
    },
  }),
};

// --- Document ----------------------------------------------------------------

const doc: Json = {
  openapi: "3.1.0",
  info: {
    title: "Flowy API",
    version: API_VERSION,
    license: { name: "MIT", identifier: "MIT" },
    description: [
      "REST API for Flowy — a personal finance manager (transactions, budgets, goals, subscriptions, categories, comments, activity, spaces, dashboard, stats, search, profile, notifications, push subscriptions, uploads, cron, health).",
      "",
      "**Authentication:** every endpoint except `/api/health` and `/api/cron/alerts` requires an authenticated Supabase session — send either the session cookies or `Authorization: Bearer <access_token>`.",
      "",
      "**Tenancy:** all data is scoped to the caller's active space (see `SpaceService.getCurrent`); personal data lives in the user's personal space.",
      "",
      "**Errors:** non-2xx responses follow the `Error` schema with a `category` from `src/lib/errors/error-types.ts`. Zod validation failures return 400 with `message` + `errors` (the original Zod issues).",
      "",
      "**Rate limiting:** in-memory fixed-window limiter (per instance). Limits vary by route — see the `x-flowy-rate-limit` extension per operation. Exceeded requests return 429 with `Retry-After` and `X-RateLimit-*` headers. Disable with `RATE_LIMIT_ENABLED=false`.",
      "",
      "This specification is **generated from code** (`pnpm generate:openapi`) and guarded against drift in CI.",
    ].join("\n"),
  },
  servers: [
    { url: "https://flowy-jade.vercel.app", description: "Production" },
    {
      url: "/",
      description: "Same-origin — local development and preview deployments",
    },
  ],
  tags: [
    { name: "Transactions", description: "Income and expense tracking" },
    { name: "Budgets", description: "Per-category monthly budgets" },
    { name: "Categories", description: "Transaction categories" },
    { name: "Goals", description: "Savings goals" },
    { name: "Subscriptions", description: "Recurring subscriptions" },
    { name: "Comments", description: "Comments on entities" },
    { name: "Activity", description: "Audit/activity feed" },
    { name: "Spaces", description: "Shared workspaces" },
    { name: "Dashboard", description: "Dashboard aggregates" },
    { name: "Stats", description: "Statistics" },
    { name: "Search", description: "Global search" },
    { name: "Profile", description: "User profiles" },
    { name: "Notifications", description: "Alerts" },
    { name: "Push", description: "Web Push subscriptions" },
    { name: "Uploads", description: "File uploads" },
    { name: "Account", description: "Account management" },
    { name: "Cron", description: "Scheduled jobs" },
    { name: "System", description: "Operational endpoints" },
  ],
  paths,
  components: {
    schemas,
    responses: RESPONSES,
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Supabase access token. Alternatively, authenticate with the Supabase session cookies (same session as the web app).",
      },
      cronAuth: {
        type: "http",
        scheme: "bearer",
        description: "The server-side CRON_SECRET (not a Supabase token).",
      },
    },
  },
};

writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
console.log(`Generated ${OUT}`);
console.log(
  `Paths: ${Object.keys(paths).length}, Operations: ${Object.values(
    paths,
  ).reduce(
    (total, p) =>
      total +
      Object.keys(p).filter((m) =>
        ["get", "post", "patch", "put", "delete"].includes(m),
      ).length,
    0,
  )}`,
);
