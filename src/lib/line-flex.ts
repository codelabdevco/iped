/**
 * iPED — LINE Flex Message Templates (v2)
 * Design: B-style header + A-style body + income/expense + category + time + iPED icon
 */

// ─── Status colors ───
const C = {
  green: "#06C755", greenBg: "#E8F8EE",
  amber: "#E09100", amberBg: "#FFF8E1",
  red: "#E53E3E", redBg: "#FEE2E2",
  blue: "#3B82F6", blueBg: "#E8F0FE",
  text: "#111111", sub: "#999999", border: "#F0F0F0",
  bg: "#F5F5F5", white: "#FFFFFF",
};

// ─── Helpers ───
function fmtDate(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  const m = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear() + 543}`;
}
function fmtTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")} น.`;
}
function fmtAmt(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Shared: header box ───
function headerBox(badge: string, badgeColor: string, badgeBg: string, logoColor: string): any {
  return {
    type: "box", layout: "horizontal", paddingAll: "14px",
    contents: [
      {
        type: "box", layout: "horizontal", flex: 0, width: "28px", height: "28px",
        cornerRadius: "7px", backgroundColor: logoColor,
        contents: [{ type: "text", text: "iPED", size: "xxs", color: C.white, align: "center", gravity: "center", weight: "bold" }],
      },
      { type: "text", text: badge, size: "xs", color: badgeColor, weight: "bold", flex: 0, margin: "md",
        decoration: "none", backgroundColor: badgeBg, offsetTop: "2px", offsetBottom: "2px" },
      { type: "text", text: `\ud83d\udd50 ${fmtTime()}`, size: "xxs", color: C.sub, align: "end", gravity: "center" },
    ],
  };
}

// ─── Shared: merchant row ───
function merchantRow(icon: string, name: string, subtext: string): any {
  return {
    type: "box", layout: "horizontal", spacing: "md", paddingBottom: "14px",
    borderWidth: "0px 0px 1px 0px", borderColor: C.border,
    contents: [
      {
        type: "box", layout: "vertical", flex: 0, width: "40px", height: "40px",
        cornerRadius: "10px", backgroundColor: "#F4F7F4",
        contents: [{ type: "text", text: icon, size: "lg", align: "center", gravity: "center" }],
      },
      {
        type: "box", layout: "vertical", flex: 1,
        contents: [
          { type: "text", text: name, size: "sm", weight: "bold", color: C.text, wrap: true },
          { type: "text", text: subtext, size: "xxs", color: C.sub, margin: "xs" },
        ],
      },
    ],
  };
}

// ─── Shared: type + category row ───
function typeCatRow(isExpense: boolean, catIcon: string, catName: string): any {
  const typeText = isExpense ? "\ud83d\udce4 รายจ่าย" : "\ud83d\udce5 รายรับ";
  const typeColor = isExpense ? C.red : C.green;
  const typeBg = isExpense ? C.redBg : C.greenBg;
  return {
    type: "box", layout: "horizontal", spacing: "sm", margin: "lg",
    contents: [
      { type: "text", text: typeText, size: "xs", color: typeColor, weight: "bold", flex: 0,
        backgroundColor: typeBg, offsetTop: "1px", offsetBottom: "1px" },
      { type: "text", text: `${catIcon} ${catName}`, size: "xs", color: "#555555", flex: 0,
        backgroundColor: C.bg, offsetTop: "1px", offsetBottom: "1px" },
    ],
  };
}

// ─── Shared: detail grid row ───
function detailRow(label: string, value: string): any {
  return {
    type: "box", layout: "vertical", flex: 1,
    contents: [
      { type: "text", text: label, size: "xxs", color: C.sub },
      { type: "text", text: value, size: "xs", color: C.text, weight: "bold", margin: "xs" },
    ],
  };
}

// ─── Shared: confidence bar ───
function confBar(pct: number, color: string): any {
  const w = Math.max(5, Math.min(100, pct));
  return {
    type: "box", layout: "horizontal", spacing: "md", paddingAll: "10px",
    cornerRadius: "8px", backgroundColor: C.bg, margin: "md",
    contents: [
      { type: "text", text: "\u0e04\u0e27\u0e32\u0e21\u0e41\u0e21\u0e48\u0e19\u0e22\u0e33", size: "xxs", color: C.sub, flex: 0 },
      {
        type: "box", layout: "vertical", flex: 1, height: "6px", cornerRadius: "3px",
        backgroundColor: "#E0E0E0",
        contents: [{
          type: "box", layout: "vertical", height: "6px", cornerRadius: "3px",
          backgroundColor: color, width: `${w}%`, contents: [{ type: "filler" }],
        }],
      },
      { type: "text", text: `${pct}%`, size: "xs", color: color, weight: "bold", flex: 0, align: "end" },
    ],
  };
}

// ─── Shared: button ───
function btnBox(label: string, style: "primary" | "secondary", color: string, data?: string, url?: string): any {
  const action: any = data
    ? { type: "postback", label, data }
    : url
    ? { type: "uri", label, uri: url }
    : { type: "message", label, text: label };
  return {
    type: "button", action, style, height: "sm", color: style === "primary" ? color : undefined,
  };
}

// ════════════════════════════════════════════════════
//  1. receiptConfirmFlex — ✅ success / ⚠️ warning
// ════════════════════════════════════════════════════
interface ReceiptFlexData {
  merchant: string;
  merchantTaxId?: string | null;
  date: string;
  amount: number;
  vat?: number | null;
  category: string;
  categoryIcon: string;
  items?: string;
  paymentMethod?: string | null;
  documentType?: string;
  confidence: number;
  receiptId: string;
  webAppUrl: string;
  isExpense?: boolean;
}

export function receiptConfirmFlex(data: ReceiptFlexData) {
  const isWarn = data.confidence < 70;
  const isExpense = data.isExpense !== false; // default expense
  const amtPrefix = isExpense ? "- " : "+ ";
  const amtColor = isWarn ? C.amber : (isExpense ? C.red : C.green);
  const badge = isWarn ? "\u26a0\ufe0f \u0e01\u0e23\u0e38\u0e15\u0e32\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a" : "\u2705 \u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08";
  const badgeColor = isWarn ? C.amber : C.green;
  const badgeBg = isWarn ? C.amberBg : C.greenBg;
  const logoColor = isWarn ? C.amber : C.green;
  const confColor = isWarn ? C.amber : C.green;
  const payment = data.paymentMethod || "\u2014";

  return {
    type: "flex" as const,
    altText: `${isExpense ? "\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22" : "\u0e23\u0e32\u0e22\u0e23\u0e31\u0e1b"} ${data.merchant} \u0e3f${fmtAmt(data.amount)}`,
    contents: {
      type: "bubble", size: "mega",
      header: headerBox(badge, badgeColor, badgeBg, logoColor),
      body: {
        type: "box", layout: "vertical", paddingAll: "16px", spacing: "md",
        contents: [
          merchantRow(data.categoryIcon, data.merchant, data.merchantTaxId ? `Tax ID: ${data.merchantTaxId}` : (data.documentType || "\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08")),
          typeCatRow(isExpense, data.categoryIcon, data.category),
          // Amount
          {
            type: "box", layout: "vertical", margin: "md",
            contents: [
              { type: "text", text: "\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21", size: "xxs", color: C.sub },
              { type: "text", text: `${amtPrefix}\u0e3f ${fmtAmt(data.amount)}`, size: "xl", weight: "bold", color: amtColor, margin: "xs" },
            ],
          },
          // Details grid
          {
            type: "box", layout: "horizontal", spacing: "md", margin: "lg",
            contents: [
              detailRow(`\ud83d\udcc5 \u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 / \u0e40\u0e27\u0e25\u0e32`, `${fmtDate(data.date)} \u00b7 ${fmtTime()}`),
              detailRow(`\ud83e\uddc9 VAT`, data.vat ? `\u0e3f ${fmtAmt(data.vat)}` : "\u2014"),
            ],
          },
          {
            type: "box", layout: "horizontal", spacing: "md", margin: "sm",
            contents: [
              detailRow(`\ud83d\udcb3 \u0e0a\u0e33\u0e23\u0e30`, payment),
              detailRow(`\ud83d\udcc4 \u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17`, data.documentType || "\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08"),
            ],
          },
          // Items
          ...(data.items ? [{
            type: "box" as const, layout: "vertical" as const, cornerRadius: "8px",
            backgroundColor: "#FAFAFA", paddingAll: "10px", margin: "lg" as const,
            contents: [
              { type: "text" as const, text: "\ud83d\udccb \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23", size: "xxs" as const, color: C.sub },
              { type: "text" as const, text: data.items, size: "xs" as const, color: "#555555", wrap: true, margin: "xs" as const },
            ],
          }] : []),
          confBar(data.confidence, confColor),
        ],
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "md", paddingAll: "12px",
        contents: [
          btnBox("\u270f\ufe0f \u0e41\u0e01\u0e49\u0e44\u0e02", "secondary", C.sub, `action=edit&id=${data.receiptId}`),
          btnBox("\u2705 \u0e22\u0e37\u0e19\u0e22\u0e31\u0e19", "primary", isWarn ? C.amber : C.green, `action=confirm&id=${data.receiptId}`),
        ],
      },
    },
  };
}

// ════════════════════════════════════════════════════
//  2. duplicateWarningFlex — 🔄
// ════════════════════════════════════════════════════
export function duplicateWarningFlex(data: {
  merchant: string;
  amount: number;
  originalDate: string;
  receiptId: string;
  categoryIcon?: string;
  category?: string;
  merchantTaxId?: string | null;
  confidence?: number;
}) {
  const conf = data.confidence || 90;
  return {
    type: "flex" as const,
    altText: `\ud83d\udd04 \u0e1e\u0e1b\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e0b\u0e49\u0e33 ${data.merchant} \u0e3f${fmtAmt(data.amount)}`,
    contents: {
      type: "bubble", size: "mega",
      header: headerBox("\ud83d\udd04 \u0e1e\u0e1b\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e0b\u0e49\u0e33", C.blue, C.blueBg, C.blue),
      body: {
        type: "box", layout: "vertical", paddingAll: "16px", spacing: "md",
        contents: [
          merchantRow(data.categoryIcon || "\ud83c\udfea", data.merchant, data.merchantTaxId ? `Tax ID: ${data.merchantTaxId}` : ""),
          typeCatRow(true, data.categoryIcon || "\ud83c\udfea", data.category || "\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1b\u0e38"),
          {
            type: "box", layout: "vertical", margin: "md",
            contents: [
              { type: "text", text: "\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21", size: "xxs", color: C.sub },
              { type: "text", text: `- \u0e3f ${fmtAmt(data.amount)}`, size: "xl", weight: "bold", color: C.blue, margin: "xs" },
            ],
          },
          // Duplicate warning box
          {
            type: "box", layout: "vertical", cornerRadius: "8px", backgroundColor: "#F0F5FF",
            paddingAll: "12px", margin: "lg", borderWidth: "0px 0px 0px 3px", borderColor: C.blue,
            contents: [
              { type: "text", text: "\u26a0\ufe0f \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e19\u0e35\u0e49\u0e2d\u0e32\u0e08\u0e0b\u0e49\u0e33\u0e01\u0e31\u0e1a", size: "xs", color: C.blue, weight: "bold" },
              { type: "text", text: `\u0e1b\u0e31\u0e19\u0e17\u0e36\u0e01\u0e40\u0e21\u0e37\u0e48\u0e2d ${fmtDate(data.originalDate)} \u2014 \u0e3f${fmtAmt(data.amount)}`, size: "xs", color: "#555555", margin: "xs", wrap: true },
              { type: "text", text: "\u0e23\u0e49\u0e32\u0e19\u0e40\u0e14\u0e35\u0e22\u0e27\u0e01\u0e31\u0e19 \u0e22\u0e2d\u0e14\u0e40\u0e14\u0e35\u0e22\u0e27\u0e01\u0e31\u0e19 \u0e27\u0e31\u0e19\u0e40\u0e14\u0e35\u0e22\u0e27\u0e01\u0e31\u0e19", size: "xxs", color: C.sub, margin: "xs" },
            ],
          },
          confBar(conf, C.green),
        ],
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "md", paddingAll: "12px",
        contents: [
          btnBox("\u274c \u0e22\u0e01\u0e40\u0e25\u0e34\u0e01", "secondary", C.sub, `action=cancel&id=${data.receiptId}`),
          btnBox("\ud83d\udcbe \u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e0b\u0e49\u0e33", "primary", C.blue, `action=force_save&id=${data.receiptId}`),
        ],
      },
    },
  };
}

// ════════════════════════════════════════════════════
//  3. errorFlex — ❌ can't read
// ════════════════════════════════════════════════════
export function errorFlex(confidence?: number) {
  const conf = confidence || 0;
  return {
    type: "flex" as const,
    altText: "\u274c \u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e43\u0e1b\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e44\u0e14\u0e49",
    contents: {
      type: "bubble", size: "mega",
      header: headerBox("\u274c \u0e2d\u0e48\u0e32\u0e19\u0e44\u0e21\u0e48\u0e0a\u0e31\u0e14", C.red, C.redBg, C.red),
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
        contents: [
          { type: "text", text: "\ud83d\udcf8", size: "3xl", align: "center" },
          { type: "text", text: "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e44\u0e14\u0e49", size: "sm", weight: "bold", color: C.text, align: "center", margin: "md" },
          { type: "text", text: "\u0e20\u0e32\u0e1e\u0e2d\u0e32\u0e08\u0e44\u0e21\u0e48\u0e0a\u0e31\u0e14\u0e2b\u0e23\u0e37\u0e2d\u0e40\u0e1a\u0e25\u0e2d\n\u0e01\u0e23\u0e38\u0e13\u0e32\u0e16\u0e48\u0e32\u0e22\u0e23\u0e39\u0e1b\u0e43\u0e2b\u0e21\u0e48\u0e43\u0e2b\u0e49\u0e0a\u0e31\u0e14\u0e40\u0e08\u0e19", size: "xs", color: C.sub, align: "center", wrap: true },
          confBar(conf, C.red),
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "12px",
        contents: [
          btnBox("\ud83d\udcf8 \u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e43\u0e2b\u0e21\u0e48", "secondary", C.sub),
        ],
      },
    },
  };
}

// ════════════════════════════════════════════════════
//  4. notReceiptFlex — 📄 not a receipt
// ════════════════════════════════════════════════════
export function notReceiptFlex() {
  return {
    type: "flex" as const,
    altText: "\ud83d\udcc4 \u0e20\u0e32\u0e1e\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e43\u0e1b\u0e40\u0e2a\u0e23\u0e47\u0e08",
    contents: {
      type: "bubble", size: "mega",
      header: headerBox("\ud83d\udcc4 \u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e43\u0e1b\u0e40\u0e2a\u0e23\u0e47\u0e08", C.red, C.redBg, C.red),
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
        contents: [
          { type: "text", text: "\ud83d\uddbc\ufe0f", size: "3xl", align: "center" },
          { type: "text", text: "\u0e20\u0e32\u0e1e\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08", size: "sm", weight: "bold", color: C.text, align: "center", margin: "md" },
          { type: "text", text: "\u0e23\u0e30\u0e1a\u0e1b\u0e15\u0e23\u0e27\u0e08\u0e1e\u0e1b\u0e27\u0e48\u0e32\u0e20\u0e32\u0e1e\u0e17\u0e35\u0e48\u0e2a\u0e48\u0e07\u0e21\u0e32\n\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e2b\u0e23\u0e37\u0e2d\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23\u0e40\u0e07\u0e34\u0e19", size: "xs", color: C.sub, align: "center", wrap: true },
          // Supported list
          {
            type: "box", layout: "vertical", cornerRadius: "8px", backgroundColor: "#FFF5F5",
            paddingAll: "12px", margin: "lg",
            contents: [
              { type: "text", text: "\ud83d\udcce \u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e17\u0e35\u0e48\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1b", size: "xxs", color: C.sub },
              { type: "text", text: "\ud83e\uddc9 \u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e23\u0e31\u0e1b\u0e40\u0e07\u0e34\u0e19\n\ud83d\udcc4 \u0e43\u0e1a\u0e01\u0e33\u0e01\u0e31\u0e1b\u0e20\u0e32\u0e29\u0e35\n\ud83c\udfe6 \u0e2a\u0e25\u0e34\u0e1b\u0e42\u0e2d\u0e19\u0e40\u0e07\u0e34\u0e19\n\ud83d\udcb3 \u0e43\u0e1b\u0e41\u0e08\u0e49\u0e07\u0e2b\u0e19\u0e35\u0e49\u0e1b\u0e31\u0e15\u0e23\u0e40\u0e04\u0e23\u0e14\u0e34\u0e15\n\ud83d\udcdd \u0e1b\u0e34\u0e25\u0e04\u0e48\u0e32\u0e19\u0e49\u0e33/\u0e04\u0e48\u0e32\u0e44\u0e1f", size: "xs", color: "#555555", wrap: true, margin: "sm", lineSpacing: "6px" },
            ],
          },
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "12px",
        contents: [
          btnBox("\ud83d\udcf8 \u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e43\u0e1b\u0e40\u0e2a\u0e23\u0e47\u0e08", "secondary", C.sub),
        ],
      },
    },
  };
}

// ════════════════════════════════════════════════════
//  5. dailySummaryFlex (keep existing)
// ════════════════════════════════════════════════════
export function dailySummaryFlex(data: {
  date: string;
  totalExpense: number;
  totalIncome: number;
  count: number;
  categories: { icon: string; name: string; amount: number }[];
}) {
  return {
    type: "flex" as const,
    altText: `\ud83d\udcca \u0e2a\u0e23\u0e38\u0e1b\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49 \u0e3f${fmtAmt(data.totalExpense)}`,
    contents: {
      type: "bubble", size: "mega",
      header: headerBox("\ud83d\udcca \u0e2a\u0e23\u0e38\u0e1b\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49", C.green, C.greenBg, C.green),
      body: {
        type: "box", layout: "vertical", paddingAll: "16px", spacing: "md",
        contents: [
          { type: "text", text: fmtDate(data.date), size: "sm", color: C.sub },
          {
            type: "box", layout: "horizontal", margin: "md",
            contents: [
              { type: "box", layout: "vertical", flex: 1, contents: [
                { type: "text", text: "\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22", size: "xxs", color: C.sub },
                { type: "text", text: `\u0e3f ${fmtAmt(data.totalExpense)}`, size: "lg", weight: "bold", color: C.red },
              ]},
              { type: "box", layout: "vertical", flex: 1, contents: [
                { type: "text", text: "\u0e23\u0e32\u0e22\u0e23\u0e31\u0e1b", size: "xxs", color: C.sub },
                { type: "text", text: `\u0e3f ${fmtAmt(data.totalIncome)}`, size: "lg", weight: "bold", color: C.green },
              ]},
            ],
          },
          { type: "text", text: `\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14 ${data.count} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23`, size: "xs", color: C.sub, margin: "md" },
          { type: "separator", color: C.border, margin: "md" },
          ...data.categories.slice(0, 5).map(c => ({
            type: "box" as const, layout: "horizontal" as const, margin: "sm" as const,
            contents: [
              { type: "text" as const, text: `${c.icon} ${c.name}`, size: "xs" as const, color: C.text, flex: 2 },
              { type: "text" as const, text: `\u0e3f ${fmtAmt(c.amount)}`, size: "xs" as const, color: C.text, align: "end" as const, flex: 1 },
            ],
          })),
        ],
      },
    },
  };
}

// ════════════════════════════════════════════════════
//  6. chatResponseFlex (keep existing)
// ════════════════════════════════════════════════════
export function chatResponseFlex(data: {
  question: string;
  answer: string;
  details?: { label: string; value: string }[];
}) {
  return {
    type: "flex" as const,
    altText: data.answer,
    contents: {
      type: "bubble", size: "mega",
      body: {
        type: "box", layout: "vertical", paddingAll: "16px",
        contents: [
          {
            type: "box", layout: "horizontal",
            contents: [
              { type: "text", text: "\ud83e\udd16", size: "lg" },
              { type: "text", text: data.answer, color: C.text, wrap: true, flex: 5, margin: "md" },
            ],
          },
          ...(data.details ? [
            { type: "separator" as const, margin: "lg" as const, color: C.border },
            {
              type: "box" as const, layout: "vertical" as const, margin: "lg" as const, spacing: "sm" as const,
              contents: data.details.map(d => ({
                type: "box" as const, layout: "horizontal" as const,
                contents: [
                  { type: "text" as const, text: d.label, size: "xs" as const, color: C.sub, flex: 2 },
                  { type: "text" as const, text: d.value, size: "xs" as const, color: C.text, flex: 3, align: "end" as const },
                ],
              })),
            },
          ] : []),
        ],
      },
    },
  };
}

// Re-export legacy name for backward compat
export { receiptConfirmFlex as budgetAlertFlex };
