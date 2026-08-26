"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/admin/copy-button";
import { createApiKey, revokeApiKey } from "@/app/admin/(panel)/developers/actions";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** Create/revoke API keys + one-time plaintext display. */
export function ApiKeysManager({ keys }: { keys: ApiKeyRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createApiKey(name);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNewKey(result.key ?? null);
      setName("");
      router.refresh();
    });
  }

  function handleRevoke(id: string) {
    setRevokingId(id);
    startTransition(async () => {
      await revokeApiKey(id);
      setRevokingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <KeyRound className="size-5" aria-hidden />
          API Keys
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keys authenticate the management API (<code>/api/v1</code>). The full key is
          shown only once at creation — store it somewhere safe.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key name (e.g. Claude, Zapier, backup script)"
            maxLength={60}
            className="sm:max-w-xs"
          />
          <Button type="button" onClick={handleCreate} disabled={isPending || name.trim().length === 0}>
            {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Generate key
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm font-medium text-destructive">{error}</p> : null}

        {newKey ? (
          <div className="mt-4 rounded-xl border border-solar/50 bg-solar-light/50 p-4">
            <p className="text-sm font-bold text-solar-dark">
              Copy this key now — it will never be shown again:
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-sm text-navy">
                {newKey}
              </code>
              <CopyButton text={newKey} label="Copy key" />
            </div>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Key</th>
                <th className="pb-2 pr-4">Created</th>
                <th className="pb-2 pr-4">Last used</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No API keys yet — generate one above.
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="border-t">
                    <td className="py-3 pr-4 font-medium text-navy">{key.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {key.prefix}…
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="py-3 pr-4">
                      {key.revokedAt ? (
                        <Badge variant="outline" className="border-destructive text-destructive">
                          Revoked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-leaf text-leaf">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {!key.revokedAt ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevoke(key.id)}
                          disabled={isPending && revokingId === key.id}
                        >
                          {isPending && revokingId === key.id ? (
                            <Loader2 className="animate-spin" aria-hidden />
                          ) : null}
                          Revoke
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
