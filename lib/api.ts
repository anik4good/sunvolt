import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateApiKey } from "@/lib/api-auth";

/**
 * Shared plumbing for the /api/v1 management API: auth guard, JSON
 * envelopes, zod error mapping, pagination parsing and serialization.
 * The endpoint contracts are documented in DEVELOPERS.md.
 */

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function listResponse(
  data: unknown[],
  total: number,
  limit: number,
  offset: number,
): Response {
  return json({ data, meta: { total, limit, offset } });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status);
}

/**
 * Wrap a route handler with API-key auth. Unauthenticated requests get a
 * uniform 401 and never reach the handler. Extra handler args (e.g. the
 * route context with params) are forwarded unchanged.
 */
export function withApiKey<C = unknown>(
  handler: (request: NextRequest, ctx: C) => Promise<Response>,
): (request: NextRequest, ctx: C) => Promise<Response> {
  return async (request, ctx) => {
    const key = await authenticateApiKey(request);
    if (!key) {
      return apiError(401, "unauthorized", "Missing, invalid or revoked API key.");
    }
    try {
      return await handler(request, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      console.error(`[api] ${request.method} ${request.nextUrl.pathname}:`, error);
      return apiError(500, "internal_error", message);
    }
  };
}

/** Parse and validate a JSON body; returns a 400 Response on failure. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.output<S> } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "Request body must be valid JSON."),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: zodError(parsed.error) };
  }
  return { ok: true, data: parsed.data as z.output<S> };
}

export function zodError(error: z.ZodError): Response {
  return apiError(
    400,
    "validation_error",
    "Request validation failed.",
    error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    })),
  );
}

export function notFound(what: string): Response {
  return apiError(404, "not_found", `${what} not found.`);
}

export function conflict(message: string): Response {
  return apiError(409, "conflict", message);
}

export function parsePagination(url: URL, defaultLimit = 50, maxLimit = 100) {
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || defaultLimit, 1), maxLimit);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  return { limit, offset };
}

/** Public pages read through cached queries — refresh them after writes. */
export function revalidateSite(): void {
  revalidatePath("/", "layout");
}

/**
 * The DB stores numerics as strings; the API speaks JSON numbers.
 * jsonb columns (specs, features…) are already JSON-safe.
 */
export function serializeProduct<T extends Record<string, unknown>>(product: T) {
  return {
    ...product,
    ...(product.price !== undefined && product.price !== null
      ? { price: Number(product.price) }
      : {}),
    ...(product.installationPrice !== undefined && product.installationPrice !== null
      ? { installationPrice: Number(product.installationPrice) }
      : {}),
    ...(product.batteryVoltage !== undefined && product.batteryVoltage !== null
      ? { batteryVoltage: Number(product.batteryVoltage) }
      : {}),
  };
}
