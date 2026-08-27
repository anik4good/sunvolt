import { json, withApiKey } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { ALL_CATEGORY_SLUGS } from "@/lib/categories";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1 — self-describing endpoint index. Machine-readable mirror
 * of DEVELOPERS.md so an AI provider can discover the whole API from
 * one authenticated request.
 */
export const GET = withApiKey(async () =>
  json({
    name: "SunVolt Management API",
    version: 1,
    documentation: "/DEVELOPERS.md",
    authentication: {
      type: "bearer",
      header: "Authorization: Bearer <api-key>",
      alternativeHeader: "X-Api-Key: <api-key>",
    },
    conventions: {
      lists: "{ data: [...], meta: { total, limit, offset } }",
      errors: "{ error: { code, message, details? } }",
    },
    endpoints: API_ENDPOINTS,
    productCategories: ALL_CATEGORY_SLUGS,
    orderStatuses: ["pending", "confirmed", "processing", "installed", "completed", "cancelled"],
  }),
);
