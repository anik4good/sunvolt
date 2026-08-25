"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ProductGalleryProps {
  /** Ordered image list; the first entry is the cover. */
  images: string[];
  name: string;
  discountPct?: number;
}

/** E-commerce image gallery: large cover + clickable thumbnail strip. */
export function ProductGallery({ images, name, discountPct }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border bg-white">
        <div className="relative aspect-square">
          {current ? (
            <Image
              key={current}
              src={current}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 550px"
              priority
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-6xl" aria-hidden>
              ⚡
            </span>
          )}
        </div>
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
    </div>
  );
}
