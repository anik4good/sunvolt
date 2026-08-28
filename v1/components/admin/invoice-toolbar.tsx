"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceToolbarProps {
  backHref: string;
  backLabel?: string;
}

/** Screen-only action bar above the invoice sheet; hidden when printing. */
export function InvoiceToolbar({ backHref, backLabel = "Back" }: InvoiceToolbarProps) {
  return (
    <div className="mx-auto flex w-full max-w-[820px] items-center justify-between gap-3 px-4 py-4 print:hidden">
      <Button asChild variant="outline">
        <Link href={backHref}>
          <ArrowLeft aria-hidden />
          {backLabel}
        </Link>
      </Button>
      <Button onClick={() => window.print()} className="font-semibold">
        <Printer aria-hidden />
        Print / Save as PDF
      </Button>
    </div>
  );
}
