import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Serve runtime-uploaded media straight from disk on every request.
 *
 * In production Next.js snapshots the public/ directory at startup, so
 * files written after boot (admin/API uploads land there) 404 until the
 * process restarts. This handler bypasses that snapshot: uploads stored
 * under public/{products,uploads} get stable /api/media/<dir>/<name>
 * URLs that work immediately and across restarts.
 */

const MEDIA_ROOTS: Record<string, string> = {
  products: path.join(process.cwd(), "public", "products"),
  uploads: path.join(process.cwd(), "public", "uploads"),
};

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const [rootKey, ...rest] = segments;
  const root = rootKey ? MEDIA_ROOTS[rootKey] : undefined;

  if (!root || rest.length === 0 || rest.some((s) => s.startsWith("."))) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Media not found." } },
      { status: 404 },
    );
  }

  // Confine resolution to the chosen root — segments cannot escape it.
  const filePath = path.resolve(root, ...rest);
  if (!filePath.startsWith(root + path.sep)) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Media not found." } },
      { status: 404 },
    );
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const contentType = ext ? MIME_TYPES[ext] : undefined;
  if (!contentType) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Media not found." } },
      { status: 404 },
    );
  }

  try {
    const data = await fs.readFile(filePath);
    // Filenames are unique at creation, so content never changes —
    // let browsers cache aggressively and survive server restarts.
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "not_found", message: "Media not found." } },
      { status: 404 },
    );
  }
}
