import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="text-5xl" aria-hidden>🔎</span>
      <h1 className="mt-4 text-2xl font-extrabold text-navy">পাওয়া যায়নি</h1>
      <p className="mt-2 text-muted-foreground">
        আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে।
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="font-bold">
          <Link href="/">হোমে ফিরে যান</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/packages">প্যাকেজ দেখুন</Link>
        </Button>
      </div>
    </div>
  );
}
