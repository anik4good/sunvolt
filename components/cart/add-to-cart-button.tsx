"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity">;
  label?: string;
  addedLabel?: string;
  /** Navigate to /cart after adding (used for strong order intent). */
  goToCart?: boolean;
  className?: string;
  size?: "default" | "lg";
}

export function AddToCartButton({
  item,
  label = "কার্টে যোগ করুন",
  addedLabel = "কার্টে যোগ হয়েছে",
  goToCart = false,
  className,
  size = "default",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(item);
    if (goToCart) {
      router.push("/cart");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <Button
      type="button"
      size={size === "lg" ? "lg" : "default"}
      onClick={handleClick}
      className={cn("font-semibold", className)}
      aria-live="polite"
    >
      {added ? (
        <>
          <Check aria-hidden />
          {addedLabel}
        </>
      ) : (
        <>
          <ShoppingCart aria-hidden />
          {label}
        </>
      )}
    </Button>
  );
}
