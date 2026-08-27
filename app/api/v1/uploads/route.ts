import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";
import { apiError, json, withApiKey } from "@/lib/api";

export const dynamic = "force-dynamic";

const UPLOAD_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * POST /api/v1/uploads — multipart/form-data with a `file` field.
 * Same rules as the admin uploader: PNG/JPG/WebP/GIF, ≤ 5 MB, stored
 * under public/products with a generated name.
 */
export const POST = withApiKey(async (request: NextRequest) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(400, "invalid_body", "Expected multipart/form-data with a `file` field.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError(400, "validation_error", "Attach the image as the `file` field.", [
      { path: "file", message: "Required." },
    ]);
  }

  const ext = UPLOAD_TYPES[file.type];
  if (!ext) {
    return apiError(400, "validation_error", "Only PNG, JPG, WebP or GIF images are allowed.");
  }
  if (file.size === 0) {
    return apiError(400, "validation_error", "The uploaded file is empty.");
  }
  if (file.size > 5 * 1024 * 1024) {
    return apiError(400, "validation_error", "Image must be under 5 MB.");
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "products");
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  } catch {
    return apiError(500, "storage_error", "Could not save the file on the server.");
  }

  revalidatePath("/admin/products");
  // Served via /api/media — production static serving only covers files
  // that existed at server startup, so fresh uploads need this route.
  return json({ path: `/api/media/products/${name}` }, 201);
});
