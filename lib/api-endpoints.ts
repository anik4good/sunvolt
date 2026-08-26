/**
 * Single source of truth for the /api/v1 endpoint catalog — rendered in
 * Admin → Developers and returned by GET /api/v1 so AI providers can
 * discover the API. Keep in sync with the route files under app/api/v1.
 */
export interface ApiEndpointDoc {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
}

export const API_ENDPOINTS: ApiEndpointDoc[] = [
  { method: "GET", path: "/stats", description: "Dashboard numbers, low-stock and recent orders" },
  { method: "GET", path: "/categories", description: "Product categories with live counts" },
  {
    method: "GET",
    path: "/products?category=&q=&active=&featured=&sort=&limit=&offset=",
    description: "List products & packages (sort: newest | price-asc | price-desc)",
  },
  { method: "POST", path: "/products", description: "Create a product or package" },
  { method: "GET", path: "/products/{idOrSlug}", description: "Fetch one product by UUID or slug" },
  { method: "PATCH", path: "/products/{idOrSlug}", description: "Partial update — send only changed fields" },
  {
    method: "DELETE",
    path: "/products/{idOrSlug}",
    description: "Delete (409 if ordered — set active=false instead)",
  },
  { method: "GET", path: "/appliances?active=&q=", description: "List calculator appliances" },
  { method: "POST", path: "/appliances", description: "Create an appliance" },
  { method: "GET", path: "/appliances/{id}", description: "Fetch one appliance" },
  { method: "PATCH", path: "/appliances/{id}", description: "Partial update" },
  { method: "DELETE", path: "/appliances/{id}", description: "Delete (409 if used in orders)" },
  { method: "GET", path: "/orders?status=&q=&limit=&offset=", description: "List orders, newest first" },
  { method: "POST", path: "/orders", description: "Create a manual order (prices from DB)" },
  { method: "GET", path: "/orders/{id}", description: "Order with items + calculator appliances" },
  { method: "PATCH", path: "/orders/{id}", description: "Update status / customer info / notes" },
  { method: "DELETE", path: "/orders/{id}", description: "Delete order (items cascade)" },
  { method: "GET", path: "/invoices?limit=&offset=", description: "List invoices with line items" },
  { method: "POST", path: "/invoices", description: "Create invoice (totals computed server-side)" },
  { method: "GET", path: "/invoices/{id}", description: "Invoice with items" },
  { method: "DELETE", path: "/invoices/{id}", description: "Delete invoice (items cascade)" },
  { method: "GET", path: "/settings", description: "Business + calculator settings" },
  { method: "PATCH", path: "/settings", description: "Partial settings update (incl. panelRates)" },
  { method: "POST", path: "/uploads", description: "Upload product image (multipart `file`) → { path }" },
];

export const API_METHOD_COLORS: Record<ApiEndpointDoc["method"], string> = {
  GET: "bg-leaf/10 text-leaf border-leaf/30",
  POST: "bg-navy/10 text-navy border-navy/30",
  PATCH: "bg-solar-light text-solar-dark border-solar/40",
  DELETE: "bg-destructive/10 text-destructive border-destructive/30",
};
