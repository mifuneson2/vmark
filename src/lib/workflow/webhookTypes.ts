/**
 * Webhook Connector Types
 *
 * Purpose: Type definitions for webhook connector specs stored as .yml files
 * in the webhooks/ directory. Same shape as Genie specs but for HTTP APIs.
 *
 * @module lib/workflow/webhookTypes
 */

/** Webhook connector definition — stored as .yml files in webhooks/ directory. */
export interface WebhookConnector {
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  auth: WebhookAuth;
  headers?: Record<string, string>;
  input: WebhookInput;
  output: WebhookOutput;
  rateLimit?: { requests: number; period: string };
}

export interface WebhookAuth {
  type: "bearer" | "api-key" | "basic" | "none";
  headerName?: string;
  credentialRef: string;
}

export interface WebhookInput {
  type: "json" | "form" | "text";
  fields: WebhookField[];
}

export interface WebhookOutput {
  type: "json" | "text";
  extract?: string;
}

export interface WebhookField {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  description?: string;
}
