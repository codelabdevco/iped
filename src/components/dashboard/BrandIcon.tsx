"use client";

/**
 * Brand icons for banks, payment methods, and services.
 * Uses official brand colors with letter/abbreviation.
 */

interface BrandIconProps {
  brand: string;
  size?: number;
  className?: string;
}

const BRANDS: Record<string, { bg: string; fg: string; label: string; radius?: string }> = {
  // Thai banks
  "bank-scb": { bg: "#4E2A84", fg: "#fff", label: "SCB" },
  "bank-kbank": { bg: "#138F2D", fg: "#fff", label: "K" },
  "bank-bbl": { bg: "#1E3A8A", fg: "#fff", label: "BBL" },
  "bank-ktb": { bg: "#1AA5DE", fg: "#fff", label: "KTB" },
  "bank-bay": { bg: "#FFC423", fg: "#1a1a1a", label: "BAY" },
  "bank-tmb": { bg: "#0066B3", fg: "#fff", label: "ttb" },
  "bank-gsb": { bg: "#E91E8C", fg: "#fff", label: "GSB" },
  "bank-ghb": { bg: "#F26522", fg: "#fff", label: "GH" },
  "bank-baac": { bg: "#0B7C3E", fg: "#fff", label: "ธกส" },
  "bank-tisco": { bg: "#1B3A6B", fg: "#fff", label: "T" },
  "bank-kk": { bg: "#003D6B", fg: "#fff", label: "KKP" },
  "bank-lhbank": { bg: "#003366", fg: "#fff", label: "LH" },
  "bank-cimb": { bg: "#ED1C24", fg: "#fff", label: "C" },
  "bank-uob": { bg: "#0038A8", fg: "#fff", label: "UOB" },
  "bank-icbc": { bg: "#C8102E", fg: "#fff", label: "I" },

  // Payment methods
  cash: { bg: "#22c55e", fg: "#fff", label: "฿" },
  promptpay: { bg: "#1A3365", fg: "#fff", label: "PP" },
  transfer: { bg: "#6366f1", fg: "#fff", label: "โอน" },
  credit: { bg: "#818CF8", fg: "#fff", label: "CC" },
  debit: { bg: "#60A5FA", fg: "#fff", label: "DC" },
  cheque: { bg: "#78716c", fg: "#fff", label: "เช็ค" },
  other: { bg: "#94A3B8", fg: "#fff", label: "อื่น" },

  // E-wallets
  "ewallet-truemoney": { bg: "#FF6600", fg: "#fff", label: "TM" },
  "ewallet-rabbit": { bg: "#00B900", fg: "#fff", label: "R" },
  "ewallet-shopee": { bg: "#EE4D2D", fg: "#fff", label: "S" },

  // Services
  line: { bg: "#06C755", fg: "#fff", label: "L", radius: "rounded-lg" },
  "google-drive": { bg: "#4285F4", fg: "#fff", label: "GD" },
  "google-sheets": { bg: "#0F9D58", fg: "#fff", label: "GS" },
  notion: { bg: "#000000", fg: "#fff", label: "N" },
  email: { bg: "#EA4335", fg: "#fff", label: "@" },
  gmail: { bg: "#EA4335", fg: "#fff", label: "G" },
  web: { bg: "#3b82f6", fg: "#fff", label: "W" },
};

export default function BrandIcon({ brand, size = 20, className = "" }: BrandIconProps) {
  const info = BRANDS[brand] || BRANDS.other;
  const fontSize = size <= 16 ? 6 : size <= 20 ? 7 : size <= 24 ? 8 : 10;
  const radius = info.radius || "rounded-full";

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 font-bold leading-none select-none ${radius} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: info.bg,
        color: info.fg,
        fontSize: `${fontSize}px`,
        letterSpacing: "-0.03em",
      }}
    >
      {info.label}
    </span>
  );
}

// Helper: get brand info
export function getBrandInfo(brand: string) {
  return BRANDS[brand] || BRANDS.other;
}

// Helper: get brand color
export function getBrandColor(brand: string) {
  return (BRANDS[brand] || BRANDS.other).bg;
}
