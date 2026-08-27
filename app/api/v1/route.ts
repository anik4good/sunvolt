import { json, withApiKey } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { PACKAGE_CATEGORY } from "@/lib/categories";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1 — self-describing endpoint index. Machine-readable mirror
 * of DEVELOPERS.md so an AI provider can discover the whole API from
 * one authenticated request.
 */
export const GET = withApiKey(async () => {
  const categories = await getCategories();
  return json({
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
    productCategories: [PACKAGE_CATEGORY, ...categories.map((c) => c.slug)],
    orderStatuses: ["pending", "confirmed", "processing", "installed", "completed", "cancelled"],
  });
});
