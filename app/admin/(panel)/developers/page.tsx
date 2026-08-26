import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { BookOpen, Terminal } from "lucide-react";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { ApiKeysManager, type ApiKeyRow } from "@/components/admin/api-keys-manager";
import { CopyButton } from "@/components/admin/copy-button";
import { API_ENDPOINTS, API_METHOD_COLORS } from "@/lib/api-endpoints";

export const metadata = { title: "Developers | SunVolt Admin" };

export default async function AdminDevelopersPage() {
  const [keyRows, headerList] = await Promise.all([
    db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt)),
    headers(),
  ]);

  const keys: ApiKeyRow[] = keyRows.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    revokedAt: k.revokedAt?.toISOString() ?? null,
  }));

  // Real base URL of this deployment for copy-paste examples.
  const host = headerList.get("host") ?? "your-domain";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : (headerList.get("x-forwarded-proto") ?? "https").split(",")[0];
  const baseUrl = `${proto}://${host}/api/v1`;

  const curlTest = `curl ${baseUrl}/stats \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;
  const curlPatch = `curl -X PATCH ${baseUrl}/products/PRODUCT_SLUG \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"price": 18900, "stock": 5}'`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Developers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage SunVolt from any AI provider or script through the REST API — full
          CRUD for products, orders, invoices, appliances and settings.
        </p>
      </div>

      <ApiKeysManager keys={keys} />

      <div className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <Terminal className="size-5" aria-hidden />
          Quick start
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Generate an API key above.</li>
          <li>
            Call any endpoint below with{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              Authorization: Bearer &lt;key&gt;
            </code>
            .
          </li>
          <li>
            Give your AI assistant the key plus{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              DEVELOPERS.md
            </code>{" "}
            (repo root) — or just the key:{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
              GET /api/v1
            </code>{" "}
            lists every endpoint.
          </li>
        </ol>

        <div className="mt-4 space-y-3">
          {[
            { label: "Test the key", code: curlTest },
            { label: "Update a product", code: curlPatch },
          ].map((example) => (
            <div key={example.label} className="rounded-lg border">
              <div className="flex items-center justify-between gap-2 border-b bg-secondary/50 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {example.label}
                </span>
                <CopyButton text={example.code} label="Copy" />
              </div>
              <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-relaxed text-navy">
                {example.code}
              </pre>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <BookOpen className="size-5" aria-hidden />
          API reference — {baseUrl}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lists return <code className="font-mono text-xs">{"{ data, meta }"}</code>;
          errors return <code className="font-mono text-xs">{"{ error: { code, message } }"}</code>.
          Full field docs live in <code className="font-mono text-xs">DEVELOPERS.md</code>.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4">Endpoint</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((endpoint) => (
                <tr key={`${endpoint.method} ${endpoint.path}`} className="border-t">
                  <td className="py-2.5 pr-4">
                    <Badge variant="outline" className={`font-mono text-xs ${API_METHOD_COLORS[endpoint.method]}`}>
                      {endpoint.method}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-navy">
                    {baseUrl}
                    <span className="font-semibold">{endpoint.path}</span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{endpoint.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
