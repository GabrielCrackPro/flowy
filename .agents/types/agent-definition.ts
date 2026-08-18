/**
 * Type definitions for Codebuff/Freebuff custom agents.
 *
 * Import these in `.agents/<agent>.ts` files for type safety:
 *
 *   import type { AgentDefinition } from "./types/agent-definition";
 *
 * The runtime reads the default-exported object; these types only help tsc
 * and your editor. `model` accepts any OpenRouter model id (e.g.
 * "deepseek/deepseek-v4-flash"); `toolNames` accepts the Codebuff tool names.
 */

export type ModelName = string;
export type ToolName = string;

export interface Logger {
  debug: (data: unknown, msg?: string) => void;
  info: (data: unknown, msg?: string) => void;
  warn: (data: unknown, msg?: string) => void;
  error: (data: unknown, msg?: string) => void;
}

export interface AgentState {
  agentId: string;
  runId: string;
  parentId: string | undefined;
  messageHistory: unknown[];
  output: Record<string, unknown> | undefined;
}

export interface AgentStepContext {
  agentState: AgentState;
  prompt?: string;
  params?: Record<string, unknown>;
  logger: Logger;
}

export interface AgentDefinition {
  /** Unique id: lowercase letters, numbers, and hyphens (e.g. "code-reviewer"). */
  id: string;
  version?: string;
  publisher?: string;
  displayName: string;
  /** Any OpenRouter model id. */
  model: ModelName;
  reasoningOptions?: {
    enabled?: boolean;
    exclude?: boolean;
    max_tokens?: number;
    effort?: "high" | "medium" | "low";
  };
  mcpServers?: Record<string, unknown>;
  toolNames?: ToolName[];
  /** Local agent ids (e.g. "reviewer") or fully-qualified store ids ("publisher/agent@0.0.1"). */
  spawnableAgents?: string[];
  inputSchema?: {
    prompt?: { type: "string"; description?: string };
    params?: Record<string, unknown>;
  };
  includeMessageHistory?: boolean;
  outputMode?: "last_message" | "all_messages" | "structured_output";
  outputSchema?: Record<string, unknown>;
  /** When other agents should spawn this one. */
  spawnerPrompt?: string;
  /** Agent identity/background. */
  systemPrompt?: string;
  /** The instructions that shape behavior. Inserted after each user input. */
  instructionsPrompt?: string;
  stepPrompt?: string;
  handleSteps?: (
    context: AgentStepContext,
  ) => Generator<unknown, void, unknown>;
}
