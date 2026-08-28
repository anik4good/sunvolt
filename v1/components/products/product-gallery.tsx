"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductGalleryProps {
  /** Ordered image list; the first entry is the cover. */
  images: string[];
  name: string;
  discountPct?: number;
}

/** E-commerce image gallery: full-fit cover + clickable thumbnail strip
 *  + click-to-zoom lightbox with prev/next navigation. */
export function ProductGallery({ images, name, discountPct }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = images[active];

  const step = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      setActive((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  // Lightbox keyboard controls + body scroll lock while open.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomed, step]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border bg-white">
        {current ? (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="View full image"
            className="group relative block w-full cursor-zoom-in"
          >
            <div className="relative aspect-square p-3">
              <Image
                key={current}
                src={current}
                alt={name}
                fill
                sizes="(max-width: 1024px) 100vw, 550px"
                priority
                className="object-contain"
              />
            </div>
            <span className="pointer-events-none absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="size-4" aria-hidden />
            </span>
          </button>
        ) : (
          <div className="relative aspect-square">
            <span className="flex h-full items-center justify-center text-6xl" aria-hidden>
              ⚡
            </span>
          </div>
        )}
        {discountPct && discountPct > 0 ? (
          <Badge className="absolute left-3 top-3 bg-destructive text-white">
            −{discountPct}%
          </Badge>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition-colors ${
                i === active ? "border-solar-dark" : "border-transparent hover:border-muted-foreground/40"
              }`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {zoomed && current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setZoomed(false)}
        >
          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              key={current}
              src={current}
              alt={name}
              fill
              sizes="100vw"
              quality={90}
              className="object-contain"
            />
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(false);
            }}
            aria-label="Close full image"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" aria-hidden />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {active + 1} / {images.length}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
