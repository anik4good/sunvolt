"use client";

import { useRef, useState, useCallback } from "react";
import { ImagePlus, Link as LinkIcon, Loader2, Star, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadProductImage } from "@/app/admin/(panel)/products/actions";

/**
 * Ordered product image list for the admin product form.
 * Position 1 is the cover image (used by cards and the cart); the
 * rest become the detail-page gallery. Images can be uploaded from
 * the admin's device or referenced by URL with drag-and-drop support.
 */
export function ProductImagesEditor({ initial }: { initial: string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const addUploaded = async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await uploadProductImage(file);
        if (result.error || !result.path) {
          setError(result.error ?? "Upload failed.");
          break;
        }
        setImages((prev) => [...prev, result.path!]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setUrl("");
    setError(null);
  };

  const remove = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const makeCover = (index: number) =>
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      return [item, ...next];
    });

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addUploaded(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addUploaded(e.target.files);
    }
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((src, index) => (
            <li
              key={`${src}-${index}`}
              className="group relative overflow-hidden rounded-lg border bg-secondary/40"
            >
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={index === 0 ? "Cover image" : `Image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-solar">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  className="absolute left-1.5 top-1.5 rounded-full bg-background/90 p-1.5 text-foreground/70 opacity-0 transition-opacity hover:text-solar-dark focus-visible:opacity-100 group-hover:opacity-100"
                  title="Make cover image"
                  aria-label={`Make image ${index + 1} the cover`}
                >
                  <Star className="size-3.5" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1.5 text-destructive opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                title="Remove image"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={`relative rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 bg-secondary/20"
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <Upload
              className={`mb-3 size-10 ${dragActive ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden
            />
            <p className="text-sm font-medium text-foreground">
              {dragActive ? "Drop images here" : "No images yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag & drop images, or click to upload
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileInput}
          aria-label="Upload images from device"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-4" aria-hidden />
          )}
          {uploading ? "Uploading…" : "Upload images"}
        </Button>
        <div className="flex min-w-56 flex-1 items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste image URL and press Add"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={!url.trim()}>
            <LinkIcon className="size-4" aria-hidden />
            Add
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {uploading && (
        <p className="text-xs text-muted-foreground">
          Uploading image(s)...
        </p>
      )}
    </div>
  );
}
