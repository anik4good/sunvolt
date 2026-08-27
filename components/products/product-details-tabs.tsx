"use client";

import { useState } from "react";
interface ProductDetailsTabsProps {
  description: string | null;
  specs: Array<[string, string]>;
}

export function ProductDetailsTabs({ description, specs }: ProductDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "specification">(
    description ? "description" : "specification",
  );

  if (!description && specs.length === 0) return null;

  const tabs = [
    ...(description ? [{ key: "description" as const, label: "Description" }] : []),
    ...(specs.length > 0
      ? [{ key: "specification" as const, label: "Technical Specification" }]
      : []),
  ];

  return (
    <section className="mt-12">
      <div className="flex overflow-x-auto border-b" role="tablist" aria-label="Product details">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`product-panel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors sm:px-6 ${
              activeTab === tab.key
                ? "border-solar-dark text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {description ? (
        <div
          id="product-panel-description"
          role="tabpanel"
          aria-label="Description"
          hidden={activeTab !== "description"}
          className="rounded-b-2xl border border-t-0 bg-card px-4 py-5 sm:px-6"
        >
          <div
            className="product-description leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-navy [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-solar-dark [&_blockquote]:pl-4 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-navy [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-3 [&_strong]:font-bold [&_ul]:mb-3"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      ) : null}

      {specs.length > 0 ? (
        <div
          id="product-panel-specification"
          role="tabpanel"
          aria-label="Technical Specification"
          hidden={activeTab !== "specification"}
        >
          <div className="grid gap-px overflow-hidden rounded-b-2xl border border-t-0 bg-border sm:grid-cols-2">
            {specs
              .filter(([key]) => key.toLowerCase() !== "place of origin")
              .map(([key, value]) => (
                <div key={key} className="bg-card px-4 py-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">{key}</p>
                  <p className="mt-0.5 font-semibold text-navy">{value}</p>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
