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

/**
 * Descriptions applied to Zod-derived request schemas by field name (the Zod
 * `toJSONSchema()` output carries no descriptions). Keep in sync with the
 * hand-written entity schemas below.
 */
const FIELD_DESC: Record<string, string> = {
  type: "INCOME or EXPENSE",
  amount: "Decimal amount (user's currency)",
  description: "Short human-readable description",
  categoryIds: "Category UUIDs to apply",
  paymentMethod: "How the transaction was paid",
  date: "Transaction date (YYYY-MM-DD)",
  notes: "Free-form notes",
  receiptUrl: "Public URL of an uploaded receipt",
  isRecurring: "Whether the transaction repeats automatically",
  budgetId: "Optional budget this transaction contributes to",
  budgetLimit: "Monthly limit for the category",
  month: "Month 1–12, or null for a whole-year budget",
  year: "Calendar year",
  name: "Display name",
  icon: "Emoji or icon key",
  color: "Hex color or theme color key",
  title: "Goal name",
  targetAmount: "Amount to save",
  savedAmount: "Amount saved so far",
  deadline: "Target date (YYYY-MM-DD), if any",
  merchant: "Service or merchant name",
  billingCycle: "How often the subscription renews",
  nextPayment: "Next charge date (YYYY-MM-DD)",
  active: "Whether the subscription is currently active",
  entityType: "Kind of entity the comment belongs to",
  entityId: "Entity the comment belongs to",
  parentId: "Parent comment UUID for replies",
  content: "Comment body",
  currency: "ISO 4217 currency code (e.g. EUR, USD)",
  locale: "BCP 47 language tag (e.g. en, es)",
  showLanguageSelector: "Whether to show the in-app language switcher",
  dashboardCards: "Ordered dashboard card keys",
  primaryColor: "CSS color for the primary theme",
  secondaryColor: "CSS color for the secondary theme",
  accentColor: "CSS color used for accents",
  avatarUrl: "Public URL of the profile avatar",
  updatedBy: "Profile UUID of the last editor, if any",
};

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
    const description = FIELD_DESC[key];
    if (
      description &&
      properties[key] &&
      typeof properties[key] === "object" &&
      !(properties[key] as Json).description
    ) {
      properties[key] = { ...(properties[key] as Json), description };
    }
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
      "The request is invalid. Check the response's `errors` details and verify the parameters or JSON body.",
    content: { "application/json": { schema: ref("Error") } },
  },
  Unauthorized: {
    description:
      "Authentication is missing or invalid. Send a valid Supabase access token as `Authorization: Bearer <access_token>`.",
    content: { "application/json": { schema: ref("Error") } },
  },
  Forbidden: {
    description:
      "The authenticated user is not allowed to perform this action.",
    content: { "application/json": { schema: ref("Error") } },
  },
  NotFound: {
    description: "The requested resource was not found in the active space.",
    content: { "application/json": { schema: ref("Error") } },
  },
  Conflict: {
    description:
      "The request conflicts with existing data, such as a duplicate name or already-registered resource.",
    content: { "application/json": { schema: ref("Error") } },
  },
  RateLimited: {
    description:
      "Too many requests. Wait for the `Retry-After` period before trying again. The `X-RateLimit-*` headers describe the current limit window.",
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
    description: "The server could not complete the request. Try again later.",
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
  scalarIgnore?: boolean;
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
  if (input.scalarIgnore) operation["x-scalar-ignore"] = true;
  return operation;
}

// --- Component schemas -------------------------------------------------------

const paginated = (itemName: string): Json => ({
  type: "object",
  properties: {
    data: {
      type: "array",
      items: ref(itemName),
      description: "Rows for the current page",
    },
    total: { type: "integer", description: "Total rows matching the filters" },
    page: { type: "integer", description: "Current page (1-based)" },
    limit: { type: "integer", description: "Page size" },
    totalPages: { type: "integer", description: "Total number of pages" },
  },
  required: ["data", "total", "page", "limit", "totalPages"],
});

const BASE_FIELDS = {
  id: { ...UUID, description: "Entity UUID" },
  userId: { ...UUID, description: "Owner profile UUID" },
  spaceId: {
    type: ["string", "null"],
    format: "uuid",
    description:
      "Shared space containing this resource, or null for personal data",
  },
  createdAt: {
    type: "string",
    format: "date-time",
    description: "Creation timestamp (ISO 8601)",
  },
  updatedAt: {
    type: "string",
    format: "date-time",
    description: "Last update timestamp (ISO 8601)",
  },
  updatedBy: {
    type: ["string", "null"],
    format: "uuid",
    description: "Profile that last edited this resource, when available",
  },
};

const OWNER_PROFILE = {
  ...ref("ProfileIdentity"),
  description: "Profile of the owner (id, name, email, avatar)",
};
const UPDATED_BY_PROFILE = {
  ...nullable("ProfileIdentity"),
  description: "Profile of the last editor, if any",
};
const SPACE_SCOPE = {
  type: ["string", "null"],
  format: "uuid",
  description: "Owning space UUID, or null for personal data",
};

const schemas: Record<string, Json> = {
  Uuid: {
    type: "string",
    format: "uuid",
    description: "Universally unique identifier",
  },
  ProfileIdentity: {
    type: "object",
    description: "Lightweight profile summary embedded in owned entities.",
    properties: {
      id: { ...UUID, description: "Entity UUID" },
      name: { type: ["string", "null"], description: "Display name" },
      email: { type: ["string", "null"], description: "Email address" },
      avatarUrl: {
        type: ["string", "null"],
        description: "Public URL of the profile avatar",
      },
    },
  },
  Category: {
    type: "object",
    properties: {
      ...BASE_FIELDS,
      name: { type: "string", description: "Display name" },
      icon: { type: ["string", "null"], description: "Emoji or icon key" },
      color: {
        type: ["string", "null"],
        description: "Hex color or theme color key",
      },
      type: {
        type: "string",
        enum: ["INCOME", "EXPENSE"],
        description: "Category kind",
      },
      user: OWNER_PROFILE,
      updatedByProfile: UPDATED_BY_PROFILE,
    },
    required: ["id", "userId", "name", "type", "createdAt", "updatedAt"],
  },
  Transaction: {
    type: "object",
    properties: {
      ...BASE_FIELDS,
      type: {
        type: "string",
        enum: ["INCOME", "EXPENSE"],
        description: "Direction of the money movement",
      },
      amount: { type: "number", description: "Decimal amount" },
      description: {
        type: ["string", "null"],
        description: "Short human-readable description",
      },
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
        description: "How the transaction was paid",
      },
      date: {
        type: ["string", "null"],
        format: "date",
        description: "Transaction date (YYYY-MM-DD)",
      },
      notes: { type: ["string", "null"], description: "Free-form notes" },
      receiptUrl: {
        type: ["string", "null"],
        description: "Public URL of an uploaded receipt",
      },
      isRecurring: {
        type: "boolean",
        description: "Whether the transaction repeats automatically",
      },
      budgetId: {
        type: ["string", "null"],
        format: "uuid",
        description: "Optional budget this transaction contributes to",
      },
      tags: {
        type: "array",
        items: ref("Category"),
        description: "Categories applied to the transaction",
      },
      user: OWNER_PROFILE,
      updatedByProfile: UPDATED_BY_PROFILE,
      budget: {
        ...nullable("BudgetSummary"),
        description: "Budget this transaction contributes to, if any",
      },
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
      id: { ...UUID, description: "Entity UUID" },
      categoryId: {
        ...UUID,
        description: "Category the budget applies to",
      },
      budgetLimit: {
        type: "number",
        description: "Monthly limit for the category",
      },
      month: {
        type: ["integer", "null"],
        description: "Month 1–12, or null for a whole-year budget",
      },
      year: { type: ["integer", "null"], description: "Calendar year" },
      category: {
        ...ref("Category"),
        description: "Category the budget covers",
      },
    },
  },
  Budget: {
    type: "object",
    description:
      "Budget row with computed expenses/income/remaining for its month.",
    properties: {
      ...BASE_FIELDS,
      categoryId: { ...UUID, description: "Category the budget applies to" },
      budgetLimit: {
        type: "number",
        description: "Monthly limit for the category",
      },
      month: {
        type: ["integer", "null"],
        minimum: 1,
        maximum: 12,
        description: "Month 1–12, or null for a whole-year budget",
      },
      year: { type: ["integer", "null"], description: "Calendar year" },
      expenses: {
        type: "number",
        description: "Sum of expenses in the period",
      },
      income: { type: "number", description: "Sum of income in the period" },
      remaining: {
        type: "number",
        description: "Remaining limit (budgetLimit minus expenses)",
      },
      category: {
        ...ref("Category"),
        description: "Category the budget covers",
      },
      user: OWNER_PROFILE,
      updatedByProfile: UPDATED_BY_PROFILE,
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
      title: { type: "string", description: "Goal name" },
      targetAmount: { type: "number", description: "Amount to save" },
      savedAmount: { type: "number", description: "Amount saved so far" },
      deadline: {
        type: ["string", "null"],
        format: "date",
        description: "Target date (YYYY-MM-DD), if any",
      },
      user: OWNER_PROFILE,
      updatedByProfile: UPDATED_BY_PROFILE,
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
      merchant: {
        type: ["string", "null"],
        description: "Service or merchant name",
      },
      amount: {
        type: ["number", "null"],
        description: "Amount charged per billing cycle",
      },
      billingCycle: {
        type: ["string", "null"],
        enum: ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", null],
        description: "How often the subscription renews",
      },
      nextPayment: {
        type: ["string", "null"],
        format: "date",
        description: "Next charge date (YYYY-MM-DD)",
      },
      active: {
        type: "boolean",
        description: "Whether the subscription is currently active",
      },
      user: OWNER_PROFILE,
      updatedByProfile: UPDATED_BY_PROFILE,
    },
    required: ["id", "userId", "active", "createdAt", "updatedAt"],
  },
  Comment: {
    type: "object",
    properties: {
      id: { ...UUID, description: "Entity UUID" },
      userId: {
        ...UUID,
        description: "Profile that owns this resource",
      },
      spaceId: SPACE_SCOPE,
      entityType: {
        type: "string",
        enum: ["transaction", "goal", "budget", "subscription"],
        description: "Kind of entity the comment belongs to",
      },
      entityId: { ...UUID, description: "Entity the comment belongs to" },
      parentId: {
        type: ["string", "null"],
        format: "uuid",
        description: "Parent comment UUID for replies",
      },
      content: { type: "string", description: "Comment body" },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Creation timestamp (ISO 8601)",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Last update timestamp (ISO 8601)",
      },
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
      id: { ...UUID, description: "Entity UUID" },
      userId: {
        ...UUID,
        description: "Profile that owns this resource",
      },
      spaceId: SPACE_SCOPE,
      actorId: {
        type: ["string", "null"],
        format: "uuid",
        description: "Profile that performed the action",
      },
      type: {
        type: "string",
        description: "Activity type, e.g. transaction.created",
      },
      entityType: {
        type: ["string", "null"],
        description: "Entity kind affected, e.g. transaction",
      },
      entityId: {
        type: ["string", "null"],
        format: "uuid",
        description: "Entity affected by the action",
      },
      metadata: {
        type: ["object", "null"],
        additionalProperties: true,
        description: "Extra context about the action",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Creation timestamp (ISO 8601)",
      },
    },
    required: ["id", "userId", "type", "createdAt"],
  },
  SpaceMember: {
    type: "object",
    description: "A user's membership in a shared space.",
    properties: {
      id: { ...UUID, description: "Entity UUID" },
      spaceId: {
        ...UUID,
        description: "Space this membership belongs to",
      },
      userId: {
        ...UUID,
        description: "Profile UUID of the member",
      },
      role: {
        type: "string",
        enum: ["owner", "member"],
        description: "Permission level within the space",
      },
      joinedAt: {
        type: "string",
        format: "date-time",
        description: "When the user joined the space",
      },
      user: { ...ref("ProfileIdentity"), description: "Profile of the member" },
    },
  },
  Space: {
    type: "object",
    properties: {
      id: { ...UUID, description: "Entity UUID" },
      name: { type: "string", description: "Display name" },
      slug: { type: ["string", "null"], description: "URL-friendly slug" },
      joinCode: {
        type: ["string", "null"],
        description: "Invite code used to join a shared space",
      },
      avatarUrl: {
        type: ["string", "null"],
        description: "Public URL of the space picture",
      },
      ownerId: { ...UUID, description: "Profile UUID of the space owner" },
      isPersonal: {
        type: "boolean",
        description: "Whether this is the user's private space",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Creation timestamp (ISO 8601)",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Last update timestamp (ISO 8601)",
      },
      members: {
        type: "array",
        items: ref("SpaceMember"),
        description: "Space members with their roles",
      },
    },
    required: ["id", "name", "ownerId", "isPersonal", "createdAt", "updatedAt"],
  },
  Alert: {
    type: "object",
    properties: {
      id: { ...UUID, description: "Entity UUID" },
      userId: {
        ...UUID,
        description: "Profile that owns this resource",
      },
      spaceId: SPACE_SCOPE,
      type: { type: "string", description: "Alert rule type" },
      severity: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Severity level",
      },
      fingerprint: {
        type: "string",
        description: "Dedup key so identical alerts are not repeated",
      },
      title: { type: "string", description: "Short alert title" },
      description: {
        type: ["string", "null"],
        description: "Longer alert details",
      },
      data: {
        type: ["object", "null"],
        additionalProperties: true,
        description: "Optional structured payload",
      },
      sentAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "When the alert was delivered",
      },
      readAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "When the user read the alert",
      },
      resolvedAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "When the alert was resolved",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Creation timestamp (ISO 8601)",
      },
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
      id: { ...UUID, description: "Entity UUID" },
      email: { type: ["string", "null"], description: "Email address" },
      name: { type: ["string", "null"], description: "Display name" },
      avatarUrl: {
        type: ["string", "null"],
        description: "Public URL of the profile avatar",
      },
      currency: {
        type: "string",
        description: "ISO 4217 currency code (e.g. EUR, USD)",
      },
      locale: {
        type: "string",
        description: "BCP 47 language tag (e.g. en, es)",
      },
      showLanguageSelector: {
        type: "boolean",
        description: "Whether to show the in-app language switcher",
      },
      activeSpaceId: {
        type: ["string", "null"],
        format: "uuid",
        description: "Currently active space",
      },
      dashboardCards: {
        type: ["array", "null"],
        items: { type: "string" },
        description: "Ordered dashboard card keys",
      },
      primaryColor: {
        type: ["string", "null"],
        description: "CSS color for the primary theme",
      },
      secondaryColor: {
        type: ["string", "null"],
        description: "CSS color for the secondary theme",
      },
      accentColor: {
        type: ["string", "null"],
        description: "CSS color used for accents",
      },
      categoriesSeeded: {
        type: "boolean",
        description:
          "Whether default categories have been seeded for this user",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Creation timestamp (ISO 8601)",
      },
    },
    required: ["id", "currency", "locale", "createdAt"],
  },
  DailyStatsPoint: {
    type: "object",
    description: "One day in the monthly series.",
    properties: {
      day: { type: "integer", description: "Day of the month (1–31)" },
      income: { type: "number", description: "Income on that day" },
      expenses: { type: "number", description: "Expenses on that day" },
      balance: { type: "number", description: "Running balance at end of day" },
    },
  },
  ExpenseCategoryStat: {
    type: "object",
    description: "Expenses aggregated per category.",
    properties: {
      name: { type: "string", description: "Category name" },
      amount: { type: "number", description: "Amount spent in that category" },
    },
  },
  DashboardStats: {
    type: "object",
    properties: {
      balance: {
        type: "number",
        description: "Current balance across the active space",
      },
      incomeThisMonth: {
        type: "number",
        description: "Income in the current month",
      },
      expensesThisMonth: {
        type: "number",
        description: "Expenses in the current month",
      },
      savingsRate: {
        type: "number",
        description: "Savings rate (0–1) for the current month",
      },
      prevIncome: {
        type: "number",
        description: "Income in the previous month",
      },
      prevExpenses: {
        type: "number",
        description: "Expenses in the previous month",
      },
      prevSavingsRate: {
        type: "number",
        description: "Savings rate (0–1) for the previous month",
      },
      activeSubscriptions: {
        type: "integer",
        description: "Active subscriptions count",
      },
      activeBudgets: {
        type: "integer",
        description: "Budgets with remaining limit in the period",
      },
      dailySeries: {
        type: "array",
        items: ref("DailyStatsPoint"),
        description: "Per-day income/expense series for the month",
      },
      expensesByCategory: {
        type: "array",
        items: ref("ExpenseCategoryStat"),
        description: "Expenses grouped by category",
      },
    },
  },
  BudgetWithSpent: {
    type: "object",
    description: "Budget with the amount actually spent so far.",
    allOf: [{ $ref: "#/components/schemas/Budget" }],
    properties: {
      spent: { type: "number", description: "Amount actually spent so far" },
    },
  },
  DashboardData: {
    type: "object",
    description: "Payload for the dashboard page.",
    properties: {
      stats: { ...ref("DashboardStats"), description: "Monthly aggregates" },
      recentTransactions: {
        type: "array",
        items: ref("Transaction"),
        description: "Most recent transactions",
      },
      budgets: {
        type: "array",
        items: ref("BudgetWithSpent"),
        description: "Budgets with spent amounts",
      },
      goals: {
        type: "array",
        items: ref("Goal"),
        description: "Savings goals",
      },
      subscriptions: {
        type: "array",
        items: ref("Subscription"),
        description: "Tracked subscriptions",
      },
      activities: {
        type: "array",
        items: ref("Activity"),
        description: "Recent activity entries",
      },
    },
  },
  SearchResultItem: {
    type: "object",
    properties: {
      id: { ...UUID, description: "Entity UUID" },
      type: {
        type: "string",
        enum: ["transaction", "category", "budget", "goal", "subscription"],
        description: "Entity kind",
      },
      title: { type: "string", description: "Display title" },
      subtitle: {
        type: ["string", "null"],
        description: "Secondary display line",
      },
      url: { type: "string", description: "App route to the entity" },
      amount: {
        type: "number",
        description: "Amount when the result is financial",
      },
    },
    required: ["id", "type", "title", "subtitle", "url"],
  },
  SearchResponse: {
    type: "object",
    properties: {
      query: { type: "string", description: "Normalized search query" },
      results: {
        type: "array",
        items: ref("SearchResultItem"),
        description: "Matching entities, ranked",
      },
      total: { type: "integer", description: "Number of results" },
    },
    required: ["query", "results", "total"],
  },
  NotificationsResponse: {
    type: "object",
    properties: {
      alerts: {
        type: "array",
        items: ref("Alert"),
        description: "Alerts in the active space (up to 50)",
      },
      unreadCount: { type: "integer", description: "Unread alerts" },
    },
    required: ["alerts", "unreadCount"],
  },
  HealthResponse: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["healthy"],
        description: "Health state",
      },
      database: {
        type: "string",
        enum: ["connected"],
        description: "Database connectivity",
      },
      timestamp: {
        type: "string",
        format: "date-time",
        description: "Check time (ISO 8601)",
      },
    },
  },
  HealthErrorResponse: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["unhealthy"],
        description: "Health state",
      },
      database: {
        type: "string",
        enum: ["disconnected"],
        description: "Database connectivity",
      },
      error: { type: "string", description: "Failure detail" },
      timestamp: {
        type: "string",
        format: "date-time",
        description: "Check time (ISO 8601)",
      },
    },
  },
  ServiceCheck: {
    type: "object",
    description: "A single component check powering the status page.",
    properties: {
      id: {
        type: "string",
        enum: ["api", "database", "auth", "push", "storage"],
        description: "Component identifier",
      },
      status: {
        type: "string",
        enum: ["ok", "degraded", "down"],
        description: "Component status",
      },
      latencyMs: {
        type: "integer",
        description: "Probe latency in milliseconds",
      },
      detail: {
        type: ["string", "null"],
        description: "Optional failure detail",
      },
    },
  },
  UptimeBar: {
    type: "object",
    description: "Worst component status recorded for a single UTC day.",
    properties: {
      date: {
        type: "string",
        format: "date",
        description: "Day (yyyy-mm-dd, UTC)",
      },
      status: {
        type: ["string", "null"],
        enum: ["ok", "degraded", "down"],
        description: "Worst status that day, or null when no checks ran",
      },
    },
  },
  StatusResponse: {
    type: "object",
    description:
      "Live status snapshot plus uptime history for the status page.",
    properties: {
      overall: {
        type: "string",
        enum: ["ok", "degraded", "down"],
        description: "Worst status across all components",
      },
      components: {
        type: "array",
        items: ref("ServiceCheck"),
        description: "Per-component checks",
      },
      generatedAt: {
        type: "string",
        format: "date-time",
        description: "Check time (ISO 8601)",
      },
      history: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: ref("UptimeBar"),
        },
        description: "Per-component uptime bars for the last 90 days",
      },
      uptime: {
        type: "object",
        additionalProperties: {
          type: ["number", "null"],
          description: "Ok/total check ratio over the window, as a percentage",
        },
        description: "Per-component uptime percentage over the history window",
      },
      lastFailure: {
        type: "object",
        additionalProperties: {
          type: ["string", "null"],
          format: "date-time",
          description: "Most recent non-ok check within the window, or null",
        },
        description: "Most recent failure time per component",
      },
      latency: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "number", description: "Check latency in ms" },
        },
        description: "Recent check latencies per component, for sparklines",
      },
      incidents: {
        type: "array",
        items: ref("Incident"),
        description: "Active (unresolved) incidents",
      },
      maintenance: {
        type: "array",
        items: ref("Incident"),
        description: "Unresolved scheduled maintenance windows",
      },
    },
  },
  CronStatusResponse: {
    type: "object",
    properties: {
      overall: {
        type: "string",
        enum: ["ok", "degraded", "down"],
        description: "Worst status across all components",
      },
      components: {
        type: "array",
        items: { type: "string" },
        description: "Checked component ids",
      },
      checkedAt: {
        type: "string",
        format: "date-time",
        description: "Check time (ISO 8601)",
      },
      transitions: {
        type: "integer",
        description: "Number of status transitions detected (and alerted)",
      },
      drafts: {
        type: "integer",
        description: "Draft incidents auto-created from down transitions",
      },
    },
  },
  StatusSummaryResponse: {
    type: "object",
    description:
      "Last recorded status snapshot without running live probes — cheap enough for the in-app header dot and external uptime monitors.",
    properties: {
      overall: {
        type: "string",
        enum: ["ok", "degraded", "down"],
        description: "Worst status across all components",
      },
      components: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              enum: ["api", "database", "auth", "push", "storage"],
            },
            status: {
              type: "string",
              enum: ["ok", "degraded", "down"],
            },
          },
        },
        description: "Last recorded status per component",
      },
      updatedAt: {
        type: ["number", "null"],
        description: "Unix ms of the most recent recorded check",
      },
      hasIncidents: {
        type: "boolean",
        description: "Whether any incident is currently active",
      },
      incidents: {
        type: "array",
        items: ref("Incident"),
        description:
          "Active (unresolved) incidents — used by the in-app banner",
      },
    },
  },
  IncidentUpdate: {
    type: "object",
    description: "A timeline entry for a status incident.",
    properties: {
      id: { type: "string", format: "uuid" },
      status: {
        type: "string",
        enum: ["investigating", "monitoring", "resolved"],
      },
      message: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  Incident: {
    type: "object",
    description: "An outage or maintenance post shown on the status page.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      message: { type: ["string", "null"] },
      status: {
        type: "string",
        enum: ["investigating", "monitoring", "resolved"],
      },
      severity: {
        type: "string",
        enum: ["minor", "major", "critical"],
        description: "Impact severity of the incident",
      },
      draft: {
        type: "boolean",
        description:
          "Draft incidents are hidden from the public page until published",
      },
      component: {
        type: ["string", "null"],
        enum: ["api", "database", "auth", "push", "storage"],
        description: "Affected component, or null for the whole platform",
      },
      type: {
        type: "string",
        enum: ["incident", "maintenance"],
        description: "Outage incident or scheduled maintenance",
      },
      scheduledStart: {
        type: ["string", "null"],
        format: "date-time",
        description: "Maintenance window start",
      },
      scheduledEnd: {
        type: ["string", "null"],
        format: "date-time",
        description: "Maintenance window end",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      resolvedAt: { type: ["string", "null"], format: "date-time" },
      updates: {
        type: "array",
        items: ref("IncidentUpdate"),
        description: "Timeline of status changes",
      },
    },
  },
  CreateIncidentRequest: {
    type: "object",
    properties: {
      title: { type: "string", maxLength: 200 },
      message: { type: ["string", "null"], maxLength: 2000 },
      status: {
        type: "string",
        enum: ["investigating", "monitoring"],
        default: "investigating",
      },
      severity: {
        type: "string",
        enum: ["minor", "major", "critical"],
        default: "major",
      },
      type: {
        type: "string",
        enum: ["incident", "maintenance"],
        default: "incident",
      },
      component: {
        type: ["string", "null"],
        enum: ["api", "database", "auth", "push", "storage"],
      },
      scheduledStart: {
        type: ["string", "null"],
        format: "date-time",
        description: "Required when type is maintenance",
      },
      scheduledEnd: {
        type: ["string", "null"],
        format: "date-time",
        description: "Required when type is maintenance",
      },
    },
    required: ["title"],
  },
  UpdateIncidentRequest: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["investigating", "monitoring", "resolved"],
      },
      message: { type: ["string", "null"], maxLength: 2000 },
    },
    required: ["status"],
  },
  IncidentsListResponse: {
    type: "object",
    properties: {
      incidents: {
        type: "array",
        items: ref("Incident"),
      },
    },
    required: ["incidents"],
  },
  IncidentResponse: {
    type: "object",
    properties: {
      incident: ref("Incident"),
    },
    required: ["incident"],
  },
  Error: {
    type: "object",
    description:
      "Common error response returned when a request cannot be completed. Validation responses may include field-level details in `errors`.",
    properties: {
      message: { type: "string", description: "Human-readable error message" },
      category: {
        type: "string",
        description: "Broad error category for client-side handling",
      },
      severity: {
        type: ["string", "null"],
        description: "Severity level, when assigned",
      },
      statusCode: {
        type: ["integer", "null"],
        description: "HTTP status code",
      },
      isRetryable: {
        type: "boolean",
        description: "Whether retrying may succeed",
      },
      errors: {
        type: ["array", "null"],
        items: { type: "object", additionalProperties: true },
        description: "Zod validation issues (message + errors only on 400s)",
      },
      retryAfter: {
        type: ["integer", "null"],
        description: "Seconds until the rate-limit window resets",
      },
      retryAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "ISO time when the rate-limit window resets",
      },
    },
    required: ["message"],
  },
  RateLimitError: {
    type: "object",
    description:
      "429 response body. Include `Retry-After` in the next request.",
    properties: {
      message: { type: "string", description: "Human-readable error message" },
      retryAfter: {
        type: "integer",
        description: "Seconds until the window resets",
      },
      retryAt: {
        type: "string",
        format: "date-time",
        description: "ISO time when the window resets",
      },
      category: {
        type: "string",
        description: "Error category (rate_limit)",
      },
      isRetryable: {
        type: "boolean",
        description: "Whether retrying may succeed",
      },
    },
  },
  SuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether the operation succeeded",
      },
    },
    required: ["success"],
  },
  DeleteAccountResponse: {
    type: "object",
    properties: {
      message: { type: "string", description: "Confirmation message" },
    },
  },
  BulkDeleteRequest: {
    type: "object",
    properties: {
      action: {
        type: "string",
        const: "bulkDelete",
        description: "Discriminator for the bulk-delete operation",
      },
      ids: {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1,
        maxItems: 100,
        description: "Entity UUIDs to delete (1–100)",
      },
    },
    required: ["action", "ids"],
  },
  BulkDeleteResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Whether the operation succeeded",
      },
      deletedCount: {
        type: "integer",
        description: "Entities deleted",
      },
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
      isPersonal: {
        type: "boolean",
        default: false,
        description: "Create as a personal (non-shared) space",
      },
    },
  },
  JoinSpaceRequest: {
    type: "object",
    properties: {
      action: {
        type: "string",
        const: "join",
        description: "Discriminator for the join operation",
      },
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
      "Action-based space update. Only the fields for the chosen action are read: setActive → none; rename → name, isPersonal, avatarUrl; leave → none; removeMember → memberUserId.",
    properties: {
      action: {
        type: "string",
        enum: ["setActive", "rename", "leave", "removeMember"],
        description: "Which operation to perform",
      },
      name: { type: "string", description: "New space name (rename only)" },
      isPersonal: {
        type: "boolean",
        description: "Whether the space is personal (rename only)",
      },
      avatarUrl: {
        type: ["string", "null"],
        description:
          "Public URL of the space picture; null removes it (rename only)",
      },
      memberUserId: {
        type: "string",
        format: "uuid",
        description: "Member to remove (removeMember only)",
      },
    },
    required: ["action"],
  },
  SetActiveSpaceResponse: {
    type: "object",
    properties: {
      activeSpaceId: {
        type: ["string", "null"],
        format: "uuid",
        description: "The user's new active space",
      },
    },
  },
  MarkNotificationsReadRequest: {
    type: "object",
    properties: {
      ids: {
        type: "array",
        items: { type: "string", format: "uuid" },
        description: "Alert UUIDs to mark as read",
      },
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
      endpoint: {
        type: "string",
        format: "uri",
        description: "Push endpoint URL",
      },
      p256dh: {
        type: "string",
        description: "Client public key (base64url)",
      },
      auth: { type: "string", description: "Client auth secret (base64url)" },
    },
    required: ["endpoint", "p256dh", "auth"],
  },
  DeletePushSubscriptionRequest: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        format: "uri",
        description: "Push endpoint URL to remove",
      },
    },
    required: ["endpoint"],
  },
  SendTestPushRequest: {
    type: "object",
    description: "Localized payload for a test push notification.",
    properties: {
      title: {
        type: "string",
        minLength: 1,
        maxLength: 80,
        description: "Notification title",
      },
      description: {
        type: "string",
        maxLength: 160,
        description: "Optional notification body",
      },
    },
    required: ["title"],
  },
  UpdatePushPreferencesRequest: {
    type: "object",
    description:
      "Enabled alert types for OS-level push. An empty array enables all types.",
    properties: {
      preferences: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "overspending",
            "budget-exceeded",
            "budget-near",
            "upcoming-payment",
            "goal-deadline",
            "goal-achieved",
            "low-savings",
            "no-budgets",
          ],
        },
        description: "Alert types to push",
      },
    },
    required: ["preferences"],
  },
  UpdateStatusPreferencesRequest: {
    type: "object",
    description:
      "Status alert preferences: master switch plus the components to alert on (empty array = all components).",
    properties: {
      enabled: { type: "boolean" },
      components: {
        type: "array",
        items: {
          type: "string",
          enum: ["api", "database", "auth", "push", "storage"],
        },
      },
    },
    required: ["enabled", "components"],
  },
  PushSubscriptionResponse: {
    type: "object",
    properties: {
      ok: { type: "boolean", description: "Whether the operation succeeded" },
      id: {
        type: "string",
        format: "uuid",
        description: "Stored push subscription UUID",
      },
    },
    required: ["ok", "id"],
  },
  ChangePasswordRequest: {
    type: "object",
    properties: {
      currentPassword: {
        type: "string",
        description: "The user's current password",
      },
      newPassword: {
        type: "string",
        minLength: 8,
        description: "New password (min 8 characters)",
      },
    },
    required: ["currentPassword", "newPassword"],
  },
  UploadResponse: {
    type: "object",
    properties: {
      url: {
        type: "string",
        format: "uri",
        description: "Public URL of the uploaded file",
      },
    },
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
  upload: "10 requests / 120s",
  status: "30 requests / 120s",
  statusSummary: "120 requests / 120s",
  statusIncident: "20 requests / 120s",
  statusComponent: "60 requests / 120s",
  statusPreferences: "20 requests / 120s",
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
  get: op({
    operationId: "pushSubscriptions.status",
    summary: "Check push subscription status",
    description:
      "Returns whether the authenticated user has stored push subscriptions, plus the list of registered devices.",
    tags: ["Push"],
    responses: responses({
      200: {
        description: "Status",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                subscribed: {
                  type: "boolean",
                  description:
                    "Whether the user has at least one stored subscription",
                },
                count: {
                  type: "integer",
                  description: "Number of stored subscriptions",
                },
                subscriptions: {
                  type: "array",
                  description: "Registered devices",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      endpoint: { type: "string", format: "uri" },
                      userAgent: {
                        type: ["string", "null"],
                        description: "User-Agent header at registration time",
                      },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                    required: ["id", "endpoint", "createdAt"],
                  },
                },
              },
              required: ["ok", "subscribed", "count", "subscriptions"],
            },
          },
        },
      },
    }),
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

paths["/api/push-subscription/test"] = {
  post: op({
    operationId: "pushSubscriptions.sendTest",
    summary: "Send a test push notification",
    description:
      "Sends a test notification to every registered device of the authenticated user so push delivery can be verified.",
    tags: ["Push"],
    requestBody: reqBody("SendTestPushRequest"),
    responses: responses({
      200: {
        description: "Sent",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                sent: {
                  type: "integer",
                  description: "Number of devices notified",
                },
              },
              required: ["ok", "sent"],
            },
          },
        },
      },
    }),
  }),
};

paths["/api/push-preferences"] = {
  get: op({
    operationId: "pushPreferences.get",
    summary: "Get push notification preferences",
    description:
      "Returns the user's enabled alert types for OS-level push. An empty list means all types are enabled.",
    tags: ["Push"],
    responses: responses({
      200: {
        description: "Preferences",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                preferences: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["preferences"],
            },
          },
        },
      },
    }),
  }),
  put: op({
    operationId: "pushPreferences.update",
    summary: "Update push notification preferences",
    description:
      "Sets which alert types are pushed as OS notifications. An empty array enables all types.",
    tags: ["Push"],
    requestBody: reqBody("UpdatePushPreferencesRequest"),
    responses: responses({
      200: {
        description: "Updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                preferences: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["ok", "preferences"],
            },
          },
        },
      },
    }),
  }),
};

paths["/api/status-preferences"] = {
  get: op({
    operationId: "statusPreferences.get",
    summary: "Get status alert preferences",
    description:
      "Returns the user's status alert preferences: a master enabled flag and the components they want alerts for (empty = all components).",
    tags: ["System"],
    responses: responses({
      200: {
        description: "Preferences",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                components: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["api", "database", "auth", "push", "storage"],
                  },
                },
              },
              required: ["enabled", "components"],
            },
          },
        },
      },
    }),
  }),
  put: op({
    operationId: "statusPreferences.update",
    summary: "Update status alert preferences",
    description:
      "Sets the master switch and which components should push status alerts. An empty components array means all components.",
    tags: ["System"],
    requestBody: reqBody("UpdateStatusPreferencesRequest"),
    responses: responses({
      200: {
        description: "Updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                enabled: { type: "boolean" },
                components: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["ok", "enabled", "components"],
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
    responses: responses(
      {
        200: {
          description: "Uploaded file URL",
          content: { "application/json": { schema: ref("UploadResponse") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.upload,
  }),
};

paths["/api/upload/space"] = {
  post: op({
    operationId: "uploads.spaceAvatar",
    summary: "Upload a space picture",
    description:
      "Multipart/form-data with a `file` field. Returns the public URL of the stored space picture.",
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
    responses: responses(
      {
        200: {
          description: "Uploaded file URL",
          content: { "application/json": { schema: ref("UploadResponse") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.upload,
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
    responses: responses(
      {
        200: {
          description: "Uploaded file URL",
          content: { "application/json": { schema: ref("UploadResponse") } },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.upload,
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
    description: "Internal scheduled operation for processing pending alerts.",
    tags: ["Cron"],
    security: [{ cronAuth: [] }],
    scalarIgnore: true,
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

paths["/api/status"] = {
  get: op({
    operationId: "status.get",
    summary: "System status",
    description:
      "Public. Runs live component checks (API, database, auth, push, storage), records them for uptime history, and returns the snapshot plus 90-day history. Rate-limited per IP.",
    tags: ["System"],
    security: NO_AUTH,
    responses: responses(
      {
        200: {
          description: "Status snapshot and history",
          content: {
            "application/json": { schema: ref("StatusResponse") },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.status,
  }),
};

paths["/api/cron/status"] = {
  post: op({
    operationId: "cron.status",
    summary: "Record scheduled status checks (cron)",
    description:
      "Internal scheduled operation that runs and persists component checks so uptime history accrues without page visits. Detects status transitions and fires push alerts when a component changes state.",
    tags: ["Cron"],
    security: [{ cronAuth: [] }],
    scalarIgnore: true,
    responses: {
      200: {
        description: "Check summary",
        content: { "application/json": { schema: ref("CronStatusResponse") } },
      },
      401: { $ref: "#/components/responses/Unauthorized" },
      500: { $ref: "#/components/responses/ServerError" },
    },
  }),
};

paths["/api/status/summary"] = {
  get: op({
    operationId: "status.summary",
    summary: "Status summary (no probes)",
    description:
      "Public. Returns the last recorded component statuses without running live probes — cheap enough for the in-app header dot and external uptime monitors. Rate-limited per IP.",
    tags: ["System"],
    security: NO_AUTH,
    responses: responses(
      {
        200: {
          description: "Last recorded status summary",
          content: {
            "application/json": {
              schema: ref("StatusSummaryResponse"),
            },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.statusSummary,
  }),
};

paths["/api/status/component/{component}"] = {
  get: op({
    operationId: "status.componentHistory",
    summary: "Component check history",
    description:
      "Public. Returns the recent individual checks (status, latency, time) for one component, powering the status page's component detail view. Rate-limited per IP.",
    tags: ["System"],
    security: NO_AUTH,
    parameters: [
      qp("component", {
        type: "string",
        enum: ["api", "database", "auth", "push", "storage"],
      }),
    ],
    responses: responses(
      {
        200: {
          description: "Component check history",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  component: { type: "string" },
                  checks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        checkedAt: { type: "string", format: "date-time" },
                        status: {
                          type: "string",
                          enum: ["ok", "degraded", "down"],
                        },
                        latencyMs: { type: ["integer", "null"] },
                      },
                    },
                  },
                },
                required: ["component", "checks"],
              },
            },
          },
        },
      },
      { rateLimited: true },
    ),
    rateLimit: RATE.statusComponent,
  }),
};

paths["/api/status/incidents"] = {
  get: op({
    operationId: "status.incidents.list",
    summary: "List status incidents (admin)",
    description:
      "Admin only. Lists all incidents (active and resolved) with their timelines, for the incident management UI in Settings.",
    tags: ["System"],
    responses: responses(
      {
        200: {
          description: "Incident list",
          content: {
            "application/json": { schema: ref("IncidentsListResponse") },
          },
        },
      },
      { rateLimited: true, forbidden: true },
    ),
    rateLimit: RATE.statusIncident,
  }),
  post: op({
    operationId: "status.incidents.create",
    summary: "Create a status incident (admin)",
    description:
      "Admin only. Posts a new incident that appears on the public status page.",
    tags: ["System"],
    requestBody: ref("CreateIncidentRequest"),
    responses: responses(
      {
        201: {
          description: "Incident created",
          content: {
            "application/json": { schema: ref("IncidentResponse") },
          },
        },
      },
      { rateLimited: true, forbidden: true },
    ),
    rateLimit: RATE.statusIncident,
  }),
};

paths["/api/status/incidents/{id}"] = {
  patch: op({
    operationId: "status.incidents.update",
    summary: "Update a status incident (admin)",
    description:
      "Admin only. Changes the incident status (e.g. investigating → monitoring → resolved) and appends a timeline entry.",
    tags: ["System"],
    parameters: [qp("id", { type: "string", format: "uuid" })],
    requestBody: ref("UpdateIncidentRequest"),
    responses: responses(
      {
        200: {
          description: "Incident updated",
          content: {
            "application/json": { schema: ref("IncidentResponse") },
          },
        },
      },
      { rateLimited: true, forbidden: true },
    ),
    rateLimit: RATE.statusIncident,
  }),
  post: op({
    operationId: "status.incidents.publish",
    summary: "Publish a draft status incident (admin)",
    description:
      "Admin only. Publishes a draft incident (auto-created from status checks) so it appears on the public status page.",
    tags: ["System"],
    parameters: [qp("id", { type: "string", format: "uuid" })],
    responses: responses(
      {
        200: {
          description: "Incident published",
          content: {
            "application/json": { schema: ref("IncidentResponse") },
          },
        },
      },
      { rateLimited: true, forbidden: true },
    ),
    rateLimit: RATE.statusIncident,
  }),
  delete: op({
    operationId: "status.incidents.delete",
    summary: "Delete a status incident (admin)",
    description:
      "Admin only. Permanently removes the incident and its timeline from the status page.",
    tags: ["System"],
    parameters: [qp("id", { type: "string", format: "uuid" })],
    responses: responses(
      {
        204: {
          description: "Incident deleted",
        },
      },
      { rateLimited: true, forbidden: true },
    ),
    rateLimit: RATE.statusIncident,
  }),
};

// --- Document ----------------------------------------------------------------

const doc: Json = {
  openapi: "3.1.0",
  "x-logo": {
    url: "/app-icon.svg",
    altText: "Flowy",
    href: "https://github.com/GabrielCrackPro/flowy",
  },
  info: {
    title: "Flowy API",
    version: API_VERSION,
    license: { name: "MIT", identifier: "MIT" },
    contact: {
      name: "Flowy",
      url: "https://github.com/GabrielCrackPro/flowy",
    },
    description: [
      "Welcome to the **Flowy API**. Use it to manage transactions, budgets, savings goals, subscriptions, categories, and shared spaces.",
      "",
      "Use the sidebar or search (`Ctrl/Cmd + K`) to find an endpoint. Each operation includes its authentication, parameters, request body, response examples, and common errors.",
      "",
      "## Base URL",
      "Production requests use `https://flowy-jade.vercel.app`. Local and preview deployments use the same-origin server. JSON endpoints accept and return `application/json` unless noted otherwise.",
      "",
      "## Authentication",
      "Send a Supabase access token with `Authorization: Bearer <access_token>`. Your requests use the authenticated user's active space; personal data is kept in the personal space.",
      "",
      "## Errors and limits",
      "Errors use a consistent `message` and `category` shape. Validation errors can include field-level details in `errors`. If a request is rate-limited, wait for `Retry-After` before retrying.",
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
    { name: "Transactions", description: "Track income and expenses" },
    { name: "Budgets", description: "Plan spending by category and period" },
    { name: "Categories", description: "Organize transaction categories" },
    { name: "Goals", description: "Track progress toward savings goals" },
    { name: "Subscriptions", description: "Manage recurring payments" },
    { name: "Comments", description: "Add comments to supported entities" },
    { name: "Activity", description: "Review recent account activity" },
    { name: "Spaces", description: "Manage personal and shared spaces" },
    { name: "Dashboard", description: "Load dashboard data and summaries" },
    {
      name: "Stats",
      description: "Load income, expense, and balance statistics",
    },
    {
      name: "Search",
      description: "Find financial records across the active space",
    },
    { name: "Profile", description: "Manage profile and display preferences" },
    { name: "Notifications", description: "Read and manage alerts" },
    { name: "Push", description: "Register browser push notifications" },
    { name: "Uploads", description: "Upload receipts and profile images" },
    { name: "Account", description: "Manage account security and deletion" },
    { name: "System", description: "Check service availability" },
  ],
  externalDocs: {
    url: "https://github.com/GabrielCrackPro/flowy",
    description: "Flowy on GitHub — source code, issues and roadmap",
  },
  paths,
  components: {
    schemas,
    responses: RESPONSES,
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Supabase access token sent as `Authorization: Bearer <access_token>`.",
      },
      cronAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Internal scheduler credential. Not used by client applications.",
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
