"use client";

/**
 * Shared currency display component.
 * - Expense: red with "-"
 * - Income: green with "+"
 * - Default: inherit color
 * - Shows .00 decimals in smaller faded style
 */
export default function Baht({
  value,
  direction,
  className = "",
  colorize = true,
}: {
  value: number;
  direction?: "expense" | "income" | "savings" | string;
  className?: string;
  colorize?: boolean;
}) {
  if (!value && value !== 0) return <span className={`opacity-30 ${className}`}>-</span>;
  const abs = Math.abs(value);
  const whole = Math.floor(abs).toLocaleString();
  const dec = (abs % 1).toFixed(2).slice(1);
  const prefix = direction === "expense" ? "-" : direction === "income" ? "+" : value < 0 ? "-" : "";

  // Auto-colorize only if no explicit text-color in className
  const hasExplicitColor = /text-(green|red|blue|pink|orange|white|gray|amber|purple|yellow)/.test(className);
  const color = colorize && !hasExplicitColor
    ? direction === "income" ? "text-green-500" : direction === "expense" ? "text-red-500" : ""
    : "";

  return (
    <span className={`font-semibold ${color} ${className}`}>
      {prefix}฿{whole}
      <span className="text-[0.75em] opacity-50">{dec}</span>
    </span>
  );
}
