import React from "react";
import { useExchangeRate } from "@/hooks/use-exchange-rate";

interface CurrencyDisplayProps {
  amountInr: number;
  amountLkr?: number; // Optional, will calculate if not provided
  showBoth?: boolean;
  className?: string;
}

export function CurrencyDisplay({ amountInr, amountLkr, showBoth = true, className }: CurrencyDisplayProps) {
  const { rate } = useExchangeRate();
  
  const lkr = amountLkr ?? (amountInr * rate);

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-medium text-foreground">₹{amountInr.toFixed(2)}</span>
      {showBoth && <span className="text-xs text-muted-foreground">Rs. {lkr.toFixed(2)}</span>}
    </div>
  );
}
