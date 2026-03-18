"use client";

interface BrandIconProps {
  brand: string;
  size?: number;
  className?: string;
}

// Brands with simpleicons CDN SVG
const SVG_BRANDS: Record<string, { slug: string; color?: string; darkColor?: string }> = {
  line: { slug: "line", color: "06C755" },
  gmail: { slug: "gmail" },
  "google-drive": { slug: "googledrive" },
  "google-sheets": { slug: "googlesheets" },
  notion: { slug: "notion", color: "000000", darkColor: "ffffff" },
  email: { slug: "gmail" },
};

// Thai bank logos from omise/banks-logo (local SVG files)
const BANK_LOGOS: Record<string, { file: string; color: string }> = {
  "bank-scb": { file: "scb", color: "#4e2e7f" },
  "bank-kbank": { file: "kbank", color: "#138f2d" },
  "bank-bbl": { file: "bbl", color: "#1e4598" },
  "bank-ktb": { file: "ktb", color: "#1ba5e1" },
  "bank-bay": { file: "bay", color: "#fec43b" },
  "bank-tmb": { file: "tmb", color: "#1279be" },
  "bank-ttb": { file: "ttb", color: "#ecf0f1" },
  "bank-gsb": { file: "gsb", color: "#eb198d" },
  "bank-ghb": { file: "ghb", color: "#f57d23" },
  "bank-baac": { file: "baac", color: "#4b9b1d" },
  "bank-tisco": { file: "tisco", color: "#12549f" },
  "bank-kk": { file: "kk", color: "#199cc5" },
  "bank-lhbank": { file: "lhb", color: "#6d6e71" },
  "bank-cimb": { file: "cimb", color: "#7e2f36" },
  "bank-uob": { file: "uob", color: "#0b3979" },
  "bank-icbc": { file: "icbc", color: "#c50f1c" },
  "bank-tcrb": { file: "tcrb", color: "#0a4ab3" },
  "bank-ibank": { file: "ibank", color: "#184615" },
};

// Brands with colored circle + text (payments, e-wallets)
const TEXT_BRANDS: Record<string, { bg: string; fg: string; label: string }> = {
  cash: { bg: "#22c55e", fg: "#fff", label: "฿" },
  promptpay: { bg: "#1A3365", fg: "#fff", label: "PP" },
  transfer: { bg: "#6366f1", fg: "#fff", label: "โอน" },
  credit: { bg: "#818CF8", fg: "#fff", label: "CC" },
  debit: { bg: "#60A5FA", fg: "#fff", label: "DC" },
  cheque: { bg: "#78716c", fg: "#fff", label: "เช็ค" },
  "ewallet-truemoney": { bg: "#FF6600", fg: "#fff", label: "TM" },
  "ewallet-rabbit": { bg: "#00B900", fg: "#fff", label: "R" },
  "ewallet-shopee": { bg: "#EE4D2D", fg: "#fff", label: "S" },
  web: { bg: "#3b82f6", fg: "#fff", label: "W" },
  other: { bg: "#94A3B8", fg: "#fff", label: "?" },
};

export default function BrandIcon({ brand, size = 20, className = "" }: BrandIconProps) {
  // SVG icon from CDN (LINE, Gmail, Drive, etc.)
  const svg = SVG_BRANDS[brand];
  if (svg) {
    const src = svg.darkColor
      ? `https://cdn.simpleicons.org/${svg.slug}/${svg.color || ""}/${svg.darkColor}`
      : `https://cdn.simpleicons.org/${svg.slug}${svg.color ? "/" + svg.color : ""}`;
    return <img src={src} alt={brand} width={size} height={size} className={`inline-block shrink-0 ${className}`} />;
  }

  // Bank logo from local SVG
  const bank = BANK_LOGOS[brand];
  if (bank) {
    return (
      <img
        src={`/banks/th/${bank.file}.svg`}
        alt={brand}
        width={size}
        height={size}
        className={`inline-block shrink-0 rounded-sm ${className}`}
      />
    );
  }

  // Text icon (payments, e-wallets, fallback)
  const info = TEXT_BRANDS[brand] || TEXT_BRANDS.other;
  const fontSize = size <= 16 ? 6 : size <= 20 ? 7 : size <= 24 ? 8 : 10;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 font-bold leading-none select-none rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: info.bg, color: info.fg, fontSize: `${fontSize}px` }}
    >
      {info.label}
    </span>
  );
}

export function getBrandColor(brand: string) {
  const bank = BANK_LOGOS[brand];
  if (bank) return bank.color;
  return (TEXT_BRANDS[brand] || TEXT_BRANDS.other).bg;
}
