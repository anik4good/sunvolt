/**
 * Browser-side image compression for admin uploads (product images and
 * description-editor inserts). Runs entirely on the client: big photos are
 * downscaled to a sane web size and re-encoded as JPEG before they ever
 * travel to the server, so uploads stay well under the server-action body
 * limit and the 5 MB server-side cap. GIFs (animation), SVGs (vector),
 * tiny files, and files the browser cannot decode are returned unchanged —
 * the server action's own validation still applies to those.
 *
 * The returned sizes let the UI show "5.3 MB → 780 KB (−85%)" per file.
 */

import { formatBytes } from "@/lib/format";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
/** Files at or below this size are uploaded untouched. */
const SKIP_BELOW_BYTES = 150 * 1024;

export interface CompressionResult {
  /** The file to actually upload — the compressed JPEG, or the original. */
  file: File;
  originalSize: number;
  compressedSize: number;
  skipped: boolean;
  /** Why the original was kept (only set when skipped). */
  reason?: string;
}

function skip(file: File, reason: string): CompressionResult {
  return {
    file,
    originalSize: file.size,
    compressedSize: file.size,
    skipped: true,
    reason,
  };
}

async function decodeImage(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}> {
  // "from-image" respects EXIF rotation (phone photos). Some browsers
  // reject the option or the format — fall back step by step, and let
  // an <img> decode try HEIC in browsers that support it (Safari).
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    // fall through
  }
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    // fall through
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file: File): Promise<CompressionResult> {
  if (file.type === "image/gif") return skip(file, "GIF (animation) kept as-is");
  if (file.type === "image/svg+xml") return skip(file, "SVG (vector) kept as-is");
  if (file.size <= SKIP_BELOW_BYTES) return skip(file, "already small");

  let decoded: Awaited<ReturnType<typeof decodeImage>>;
  try {
    decoded = await decodeImage(file);
  } catch {
    return skip(file, "unreadable, uploaded as-is");
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(decoded.width * scale);
  canvas.height = Math.round(decoded.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return skip(file, "unreadable, uploaded as-is");
  // Flatten transparency onto white — product photos expect a white page.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
  if ("close" in decoded.source) decoded.source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  // Tiny renders or already-optimized files can come out larger — keep
  // the original whenever compression did not actually help.
  if (!blob || blob.size >= file.size) return skip(file, "no smaller, kept as-is");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const compressed = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  return {
    file: compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    skipped: false,
  };
}

/** "IMG_2043.jpg: 5.3 MB → 780 KB (−85%)" or the keep-as-is reason. */
export function describeCompression(
  name: string,
  result: CompressionResult,
): string {
  if (result.skipped) return `${name}: ${result.reason}`;
  const saved = Math.max(
    0,
    Math.round((1 - result.compressedSize / result.originalSize) * 100),
  );
  return `${name}: ${formatBytes(result.originalSize)} → ${formatBytes(
    result.compressedSize,
  )} (−${saved}%)`;
}
