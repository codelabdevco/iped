"use client";

/**
 * Shared currency display component.
 * - White text by default
 * - Prepends "-" for expenses (direction="expense")
 * - Prepends "+" for income (direction="income")
 * - Shows .00 decimals in smaller faded style
 */
export default function Baht({
  value,
  direction,
  className = "",
}: {
  value: number;
  direction?: "expense" | "income" | "savings" | string;
  className?: string;
}) {
  if (!value && value !== 0) return <span className={`opacity-30 ${className}`}>-</span>;
  const abs = Math.abs(value);
  const whole = Math.floor(abs).toLocaleString();
  const dec = (abs % 1).toFixed(2).slice(1);
  const prefix = direction === "expense" ? "-" : direction === "income" ? "+" : value < 0 ? "-" : "";

  return (
    <span className={`font-semibold text-white ${className}`}>
      {prefix}฿{whole}
      <span className="text-[0.75em] opacity-50">{dec}</span>
    </span>
  );
}
