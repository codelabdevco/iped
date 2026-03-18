/**
 * iped — LINE Flex Message Templates (v3)
 * Design: Brand-aligned, amount-as-hero, clear visual hierarchy
 * Theme: iPED red (#FA3633) accent, yellow (#FFDE00) primary
 */

// ─── Brand & Status Colors ───
const C = {
  // iPED brand
  brand: "#FA3633",
  brandBg: "#FFF0F0",
  gold: "#FFDE00",
  goldBg: "#FFFAE6",

  // Status
  green: "#06C755",
  greenBg: "#E8F8EE",
  greenLight: "#D4EDDA",
  amber: "#E09100",
  amberBg: "#FFF8E1",
  red: "#E53E3E",
  redBg: "#FEE2E2",
  blue: "#3B82F6",
  blueBg: "#EBF2FF",

  // Neutral
  text: "#111111",
  textSec: "#555555",
  sub: "#999999",
  muted: "#BBBBBB",
  border: "#EEEEEE",
  bg: "#F7F7F7",
  bgCard: "#FAFAFA",
  white: "#FFFFFF",
};

// ─── Helpers ───
function fmtDate(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  const m = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear() + 543}`;
}

function fmtTime(t?: string | null): string {
  if (t) return t.includes("น.") ? t : `${t} น.`;
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} น.`;
}

function fmtAmt(n: number): string {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Shared Components ───

/** Brand header: iPED logo + status pill */
function headerBar(
  statusText: string,
  statusColor: string,
  bandColor: string,
): any {
  return {
    type: "box",
    layout: "horizontal",
    paddingAll: "14px",
    backgroundColor: bandColor,
    contents: [
      // iPED logo circle
      {
        type: "box",
        layout: "horizontal",
        flex: 0,
        width: "24px",
        height: "24px",
        cornerRadius: "12px",
        backgroundColor: C.brand,
        contents: [
          {
            type: "text",
            text: "i",
            size: "xs",
            color: C.white,
            align: "center",
            gravity: "center",
            weight: "bold",
          },
        ],
      },
      {
        type: "text",
        text: "iPED",
        size: "xs",
        color: C.textSec,
        weight: "bold",
        flex: 0,
        gravity: "center",
        margin: "sm",
      },
      { type: "filler" },
      // Status pill
      {
        type: "box",
        layout: "horizontal",
        flex: 0,
        cornerRadius: "12px",
        backgroundColor: statusColor,
        paddingStart: "10px",
        paddingEnd: "10px",
        paddingTop: "4px",
        paddingBottom: "4px",
        contents: [
          {
            type: "text",
            text: statusText,
            size: "xxs",
            color: C.white,
            weight: "bold",
            align: "center",
          },
        ],
      },
    ],
  };
}

/** Amount hero block */
function amountHero(
  amount: number,
  isExpense: boolean,
  color: string,
): any {
  const prefix = isExpense ? "-" : "+";
  return {
    type: "box",
    layout: "vertical",
    alignItems: "center",
    margin: "lg",
    contents: [
      {
        type: "text",
        text: `${prefix}฿${fmtAmt(amount)}`,
        size: "xxl",
        weight: "bold",
        color,
        align: "center",
      },
    ],
  };
}

/** Merchant + category row */
function merchantInfo(
  icon: string,
  name: string,
  category: string,
  subtext?: string,
): any {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: [
      {
        type: "box",
        layout: "vertical",
        flex: 0,
        width: "40px",
        height: "40px",
        cornerRadius: "10px",
        backgroundColor: C.bg,
        contents: [
          {
            type: "text",
            text: icon,
            size: "md",
            align: "center",
            gravity: "center",
          },
        ],
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        justifyContent: "center",
        contents: [
          {
            type: "text",
            text: name,
            size: "sm",
            weight: "bold",
            color: C.text,
            wrap: true,
            maxLines: 2,
          },
          {
            type: "text",
            text: category + (subtext ? ` · ${subtext}` : ""),
            size: "xxs",
            color: C.sub,
            margin: "xs",
          },
        ],
      },
    ],
  };
}

/** Detail row: label + value side by side */
function detailItem(label: string, value: string): any {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "xs", color: C.sub, flex: 3 },
      {
        type: "text",
        text: value,
        size: "xs",
        color: C.text,
        weight: "bold",
        flex: 4,
        align: "end",
      },
    ],
  };
}

/** Direction badge (รายจ่าย / รายรับ / เงินออม) */
function directionBadge(isExpense: boolean): any {
  const text = isExpense ? "รายจ่าย" : "รายรับ";
  const color = isExpense ? C.red : C.green;
  const bg = isExpense ? C.redBg : C.greenBg;
  return {
    type: "box",
    layout: "horizontal",
    flex: 0,
    cornerRadius: "10px",
    backgroundColor: bg,
    paddingStart: "8px",
    paddingEnd: "8px",
    paddingTop: "3px",
    paddingBottom: "3px",
    contents: [
      {
        type: "text",
        text,
        size: "xxs",
        color,
        weight: "bold",
      },
    ],
  };
}

/** Confidence indicator bar */
function confidenceBar(pct: number, color: string): any {
  const w = Math.max(5, Math.min(100, pct));
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    paddingAll: "10px",
    cornerRadius: "8px",
    backgroundColor: C.bg,
    margin: "lg",
    alignItems: "center",
    contents: [
      {
        type: "text",
        text: "ความแม่นยำ",
        size: "xxs",
        color: C.sub,
        flex: 0,
        gravity: "center",
      },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        height: "6px",
        cornerRadius: "3px",
        backgroundColor: "#E0E0E0",
        contents: [
          {
            type: "box",
            layout: "vertical",
            height: "6px",
            cornerRadius: "3px",
            backgroundColor: color,
            width: `${w}%`,
            contents: [{ type: "filler" }],
          },
        ],
      },
      {
        type: "text",
        text: `${pct}%`,
        size: "xs",
        color,
        weight: "bold",
        flex: 0,
        align: "end",
        gravity: "center",
      },
    ],
  };
}

/** Footer with action buttons + branding */
function footerBox(buttons: any[]): any {
  return {
    type: "box",
    layout: "vertical",
    paddingAll: "14px",
    spacing: "sm",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: buttons,
      },
      {
        type: "text",
        text: "iPED by codelabs tech",
        size: "xxs",
        color: C.muted,
        align: "center",
        margin: "md",
      },
    ],
  };
}

/** Action button */
function actionBtn(
  label: string,
  style: "primary" | "secondary",
  color: string,
  opts?: { data?: string; url?: string },
): any {
  const action: any = opts?.data
    ? { type: "postback", label, data: opts.data }
    : opts?.url
      ? { type: "uri", label, uri: opts.url }
      : { type: "message", label, text: label };

  if (style === "primary") {
    return {
      type: "box",
      layout: "horizontal",
      backgroundColor: color,
      cornerRadius: "8px",
      paddingAll: "10px",
      flex: 1,
      action,
      contents: [
        {
          type: "text",
          text: label,
          size: "xs",
          color: C.white,
          align: "center",
          weight: "bold",
        },
      ],
    };
  }
  return {
    type: "box",
    layout: "horizontal",
    backgroundColor: C.bg,
    cornerRadius: "8px",
    paddingAll: "10px",
    flex: 1,
    action,
    contents: [
      {
        type: "text",
        text: label,
        size: "xs",
        color: C.textSec,
        align: "center",
        weight: "bold",
      },
    ],
  };
}

/** Thin separator */
function sep(): any {
  return { type: "separator", color: C.border, margin: "lg" };
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://iped.codelabdev.co";

// ════════════════════════════════════════════════════════════
//  1. receiptConfirmFlex — ยืนยันใบเสร็จ (success / warning)
// ════════════════════════════════════════════════════════════

interface ReceiptFlexData {
  merchant: string;
  merchantTaxId?: string | null;
  date: string;
  time?: string | null;
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
  const isExpense = data.isExpense !== false;
  const isWarn = data.confidence < 70;
  const isLow = data.confidence < 40;

  // Colors based on confidence + direction
  const statusText = isLow
    ? "❌ ตรวจสอบ"
    : isWarn
      ? "⚠️ ตรวจสอบ"
      : "✅ สำเร็จ";
  const statusColor = isLow ? C.red : isWarn ? C.amber : C.green;
  const bandColor = isLow ? C.redBg : isWarn ? C.amberBg : C.greenBg;
  const amtColor = isExpense ? C.red : C.green;

  // Items — max 3 lines
  const itemLines = data.items
    ? data.items.split("\n").filter(Boolean)
    : [];
  const showItems = itemLines.slice(0, 3);
  const moreItems = itemLines.length > 3 ? itemLines.length - 3 : 0;

  return {
    type: "flex" as const,
    altText: `${isExpense ? "รายจ่าย" : "รายรับ"} ${data.merchant} ฿${fmtAmt(data.amount)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar(statusText, statusColor, bandColor),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "sm",
        contents: [
          // Direction badge + document type
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              directionBadge(isExpense),
              ...(data.documentType
                ? [
                    {
                      type: "box" as const,
                      layout: "horizontal" as const,
                      flex: 0,
                      cornerRadius: "10px",
                      backgroundColor: C.bg,
                      paddingStart: "8px",
                      paddingEnd: "8px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      contents: [
                        {
                          type: "text" as const,
                          text: data.documentType,
                          size: "xxs" as const,
                          color: C.sub,
                        },
                      ],
                    },
                  ]
                : []),
              { type: "filler" as const },
            ],
          },

          // Amount — HERO
          amountHero(data.amount, isExpense, amtColor),

          // Merchant info
          merchantInfo(
            data.categoryIcon,
            data.merchant,
            data.category,
            data.merchantTaxId || undefined,
          ),

          sep(),

          // Detail grid
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "lg",
            contents: [
              detailItem(
                "📅 วันที่",
                fmtDate(data.date),
              ),
              detailItem("🕐 เวลา", fmtTime(data.time)),
              detailItem(
                "💳 ชำระ",
                data.paymentMethod || "—",
              ),
              ...(data.vat
                ? [
                    detailItem(
                      "🧾 VAT",
                      `฿${fmtAmt(data.vat)}`,
                    ),
                  ]
                : []),
            ],
          },

          // Items (if any)
          ...(showItems.length > 0
            ? [
                sep(),
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  spacing: "xs" as const,
                  margin: "lg" as const,
                  contents: [
                    {
                      type: "text" as const,
                      text: "📋 รายการ",
                      size: "xxs" as const,
                      color: C.sub,
                      margin: "sm" as const,
                    },
                    ...showItems.map((item) => ({
                      type: "text" as const,
                      text: item,
                      size: "xs" as const,
                      color: C.textSec,
                      wrap: true,
                    })),
                    ...(moreItems > 0
                      ? [
                          {
                            type: "text" as const,
                            text: `+ อีก ${moreItems} รายการ`,
                            size: "xxs" as const,
                            color: C.blue,
                            margin: "xs" as const,
                          },
                        ]
                      : []),
                  ],
                },
              ]
            : []),

          // Confidence bar
          confidenceBar(data.confidence, statusColor),
        ],
      },
      footer: footerBox([
        actionBtn("✏️ แก้ไข", "secondary", C.sub, {
          url: `${APP_URL}/receipt/${data.receiptId}/edit`,
        }),
        actionBtn(
          "✅ ยืนยัน",
          "primary",
          statusColor,
          { data: `action=confirm&id=${data.receiptId}` },
        ),
      ]),
    },
  };
}

// ════════════════════════════════════════════════════════════
//  2. duplicateWarningFlex — 🔄 พบรายการซ้ำ
// ════════════════════════════════════════════════════════════

export function duplicateWarningFlex(data: {
  merchant: string;
  amount: number;
  originalDate: string;
  receiptId: string;
  categoryIcon?: string;
  category?: string;
  merchantTaxId?: string | null;
  confidence?: number;
  isExpense?: boolean;
}) {
  const conf = data.confidence || 90;
  const isExpense = data.isExpense !== false;

  return {
    type: "flex" as const,
    altText: `🔄 พบรายการซ้ำ ${data.merchant} ฿${fmtAmt(data.amount)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("🔄 ซ้ำ", C.blue, C.blueBg),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "sm",
        contents: [
          // Amount
          amountHero(data.amount, isExpense, C.blue),

          // Merchant
          merchantInfo(
            data.categoryIcon || "🏪",
            data.merchant,
            data.category || "ไม่ระบุ",
            data.merchantTaxId || undefined,
          ),

          sep(),

          // Duplicate comparison box
          {
            type: "box",
            layout: "vertical",
            cornerRadius: "10px",
            backgroundColor: C.blueBg,
            paddingAll: "14px",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "⚠️ พบรายการที่คล้ายกัน",
                size: "xs",
                color: C.blue,
                weight: "bold",
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                spacing: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: "รายการเดิม",
                        size: "xxs",
                        color: C.sub,
                      },
                      {
                        type: "text",
                        text: fmtDate(data.originalDate),
                        size: "xs",
                        color: C.text,
                        weight: "bold",
                        margin: "xs",
                      },
                      {
                        type: "text",
                        text: `฿${fmtAmt(data.amount)}`,
                        size: "xs",
                        color: C.textSec,
                        margin: "xs",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    flex: 0,
                    width: "1px",
                    backgroundColor: "#D0D8E8",
                    contents: [{ type: "filler" }],
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: "รายการใหม่",
                        size: "xxs",
                        color: C.sub,
                      },
                      {
                        type: "text",
                        text: "วันนี้",
                        size: "xs",
                        color: C.text,
                        weight: "bold",
                        margin: "xs",
                      },
                      {
                        type: "text",
                        text: `฿${fmtAmt(data.amount)}`,
                        size: "xs",
                        color: C.textSec,
                        margin: "xs",
                      },
                    ],
                  },
                ],
              },
              {
                type: "text",
                text: "ร้านเดียวกัน · ยอดเดียวกัน · วันใกล้กัน",
                size: "xxs",
                color: C.sub,
                margin: "md",
                wrap: true,
              },
            ],
          },

          confidenceBar(conf, C.green),
        ],
      },
      footer: footerBox([
        actionBtn("❌ ยกเลิก", "secondary", C.sub, {
          data: `action=cancel&id=${data.receiptId}`,
        }),
        actionBtn("💾 บันทึกซ้ำ", "primary", C.blue, {
          data: `action=force_save&id=${data.receiptId}`,
        }),
      ]),
    },
  };
}

// ════════════════════════════════════════════════════════════
//  3. errorFlex — ❌ อ่านไม่ได้
// ════════════════════════════════════════════════════════════

export function errorFlex(confidence?: number) {
  const conf = confidence || 0;
  return {
    type: "flex" as const,
    altText: "❌ ไม่สามารถอ่านใบเสร็จได้",
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("❌ ผิดพลาด", C.red, C.redBg),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "📸",
            size: "xxl",
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: "ไม่สามารถอ่านใบเสร็จได้",
            size: "md",
            weight: "bold",
            color: C.text,
            align: "center",
            margin: "lg",
          },
          {
            type: "text",
            text: "ภาพอาจไม่ชัดหรือเบลอ\nกรุณาถ่ายรูปใหม่ให้ชัดเจน",
            size: "xs",
            color: C.sub,
            align: "center",
            wrap: true,
            margin: "sm",
          },

          // Tips box
          {
            type: "box",
            layout: "vertical",
            cornerRadius: "10px",
            backgroundColor: C.bg,
            paddingAll: "14px",
            margin: "xl",
            contents: [
              {
                type: "text",
                text: "💡 เคล็ดลับถ่ายรูปใบเสร็จ",
                size: "xxs",
                color: C.textSec,
                weight: "bold",
              },
              {
                type: "text",
                text: "• วางใบเสร็จบนพื้นเรียบ\n• ถ่ายตรงๆ ไม่เอียง\n• แสงสว่างเพียงพอ\n• เห็นตัวอักษรชัดเจน",
                size: "xxs",
                color: C.sub,
                wrap: true,
                margin: "sm",
                lineSpacing: "4px",
              },
            ],
          },

          confidenceBar(conf, C.red),
        ],
      },
      footer: footerBox([
        actionBtn("📸 ส่งรูปใหม่", "primary", C.brand),
      ]),
    },
  };
}

// ════════════════════════════════════════════════════════════
//  4. notReceiptFlex — 📄 ไม่ใช่ใบเสร็จ
// ════════════════════════════════════════════════════════════

export function notReceiptFlex() {
  return {
    type: "flex" as const,
    altText: "📄 ภาพนี้ไม่ใช่ใบเสร็จ",
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("📄 ไม่ใช่ใบเสร็จ", C.amber, C.amberBg),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "🖼️",
            size: "xxl",
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: "ภาพนี้ไม่ใช่ใบเสร็จ",
            size: "md",
            weight: "bold",
            color: C.text,
            align: "center",
            margin: "lg",
          },
          {
            type: "text",
            text: "ระบบตรวจพบว่าภาพที่ส่งมา\nไม่ใช่เอกสารทางการเงิน",
            size: "xs",
            color: C.sub,
            align: "center",
            wrap: true,
            margin: "sm",
          },

          // Supported types
          {
            type: "box",
            layout: "vertical",
            cornerRadius: "10px",
            backgroundColor: C.bg,
            paddingAll: "14px",
            margin: "xl",
            contents: [
              {
                type: "text",
                text: "📎 เอกสารที่รองรับ",
                size: "xxs",
                color: C.textSec,
                weight: "bold",
              },
              {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                margin: "md",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    spacing: "lg",
                    contents: [
                      {
                        type: "text",
                        text: "🧾 ใบเสร็จ",
                        size: "xxs",
                        color: C.textSec,
                        flex: 1,
                      },
                      {
                        type: "text",
                        text: "📄 ใบกำกับภาษี",
                        size: "xxs",
                        color: C.textSec,
                        flex: 1,
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    spacing: "lg",
                    contents: [
                      {
                        type: "text",
                        text: "🏦 สลิปโอนเงิน",
                        size: "xxs",
                        color: C.textSec,
                        flex: 1,
                      },
                      {
                        type: "text",
                        text: "💳 ใบแจ้งหนี้",
                        size: "xxs",
                        color: C.textSec,
                        flex: 1,
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    spacing: "lg",
                    contents: [
                      {
                        type: "text",
                        text: "📝 บิลค่าน้ำ/ไฟ",
                        size: "xxs",
                        color: C.textSec,
                        flex: 1,
                      },
                      { type: "filler" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: footerBox([
        actionBtn("📸 ส่งรูปใบเสร็จ", "primary", C.brand),
      ]),
    },
  };
}

// ════════════════════════════════════════════════════════════
//  5. dailySummaryFlex — 📊 สรุปรายวัน
// ════════════════════════════════════════════════════════════

export function dailySummaryFlex(data: {
  date: string;
  totalExpense: number;
  totalIncome: number;
  count: number;
  categories: { icon: string; name: string; amount: number }[];
}) {
  const net = data.totalIncome - data.totalExpense;
  const netColor = net >= 0 ? C.green : C.red;
  const netPrefix = net >= 0 ? "+" : "";
  const maxAmt = Math.max(...data.categories.map((c) => c.amount), 1);

  return {
    type: "flex" as const,
    altText: `📊 สรุปวันนี้ ฿${fmtAmt(data.totalExpense)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("📊 สรุปวันนี้", C.green, C.greenBg),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "sm",
        contents: [
          // Date
          {
            type: "text",
            text: fmtDate(data.date),
            size: "xs",
            color: C.sub,
          },

          // Income / Expense cards
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "lg",
            contents: [
              // Expense card
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                cornerRadius: "10px",
                backgroundColor: C.redBg,
                paddingAll: "12px",
                contents: [
                  {
                    type: "text",
                    text: "📤 รายจ่าย",
                    size: "xxs",
                    color: C.red,
                  },
                  {
                    type: "text",
                    text: `฿${fmtAmt(data.totalExpense)}`,
                    size: "lg",
                    weight: "bold",
                    color: C.red,
                    margin: "sm",
                  },
                ],
              },
              // Income card
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                cornerRadius: "10px",
                backgroundColor: C.greenBg,
                paddingAll: "12px",
                contents: [
                  {
                    type: "text",
                    text: "📥 รายรับ",
                    size: "xxs",
                    color: C.green,
                  },
                  {
                    type: "text",
                    text: `฿${fmtAmt(data.totalIncome)}`,
                    size: "lg",
                    weight: "bold",
                    color: C.green,
                    margin: "sm",
                  },
                ],
              },
            ],
          },

          // Net summary
          {
            type: "box",
            layout: "horizontal",
            cornerRadius: "10px",
            backgroundColor: C.bg,
            paddingAll: "10px",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "คงเหลือสุทธิ",
                size: "xs",
                color: C.sub,
                flex: 1,
                gravity: "center",
              },
              {
                type: "text",
                text: `${netPrefix}฿${fmtAmt(Math.abs(net))}`,
                size: "md",
                weight: "bold",
                color: netColor,
                flex: 0,
                align: "end",
              },
            ],
          },

          // Transaction count
          {
            type: "text",
            text: `รายการทั้งหมด ${data.count} รายการ`,
            size: "xxs",
            color: C.sub,
            margin: "md",
          },

          sep(),

          // Top categories with mini bars
          {
            type: "text",
            text: "🏷️ หมวดหมู่",
            size: "xxs",
            color: C.sub,
            margin: "lg",
          },
          ...data.categories.slice(0, 5).map((c) => ({
            type: "box" as const,
            layout: "vertical" as const,
            margin: "sm" as const,
            spacing: "xs" as const,
            contents: [
              {
                type: "box" as const,
                layout: "horizontal" as const,
                contents: [
                  {
                    type: "text" as const,
                    text: `${c.icon} ${c.name}`,
                    size: "xs" as const,
                    color: C.text,
                    flex: 2,
                  },
                  {
                    type: "text" as const,
                    text: `฿${fmtAmt(c.amount)}`,
                    size: "xs" as const,
                    color: C.text,
                    weight: "bold" as const,
                    align: "end" as const,
                    flex: 1,
                  },
                ],
              },
              // Mini progress bar
              {
                type: "box" as const,
                layout: "vertical" as const,
                height: "3px",
                cornerRadius: "2px",
                backgroundColor: "#E8E8E8",
                contents: [
                  {
                    type: "box" as const,
                    layout: "vertical" as const,
                    height: "3px",
                    cornerRadius: "2px",
                    backgroundColor: C.brand,
                    width: `${Math.round((c.amount / maxAmt) * 100)}%`,
                    contents: [{ type: "filler" as const }],
                  },
                ],
              },
            ],
          })),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        spacing: "sm",
        contents: [
          actionBtn("📊 ดูรายงานเพิ่มเติม", "primary", C.brand, {
            url: `${APP_URL}/dashboard/reports`,
          }),
          {
            type: "text",
            text: "iPED by codelabs tech",
            size: "xxs",
            color: C.muted,
            align: "center",
            margin: "md",
          },
        ],
      },
    },
  };
}

// ════════════════════════════════════════════════════════════
//  6. chatResponseFlex — 🤖 AI ตอบคำถาม
// ════════════════════════════════════════════════════════════

export function chatResponseFlex(data: {
  question: string;
  answer: string;
  details?: { label: string; value: string }[];
}) {
  return {
    type: "flex" as const,
    altText: data.answer,
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("🤖 ผู้ช่วย AI", C.brand, C.brandBg),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          // Question bubble
          {
            type: "box",
            layout: "horizontal",
            cornerRadius: "12px",
            backgroundColor: C.bg,
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: `💬 "${data.question}"`,
                size: "xs",
                color: C.sub,
                wrap: true,
              },
            ],
          },

          // Answer
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            margin: "lg",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 0,
                width: "32px",
                height: "32px",
                cornerRadius: "16px",
                backgroundColor: C.brandBg,
                contents: [
                  {
                    type: "text",
                    text: "🤖",
                    size: "sm",
                    align: "center",
                    gravity: "center",
                  },
                ],
              },
              {
                type: "text",
                text: data.answer,
                size: "sm",
                color: C.text,
                wrap: true,
                flex: 5,
              },
            ],
          },

          // Details table (if any)
          ...(data.details && data.details.length > 0
            ? [
                sep(),
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  margin: "lg" as const,
                  spacing: "sm" as const,
                  cornerRadius: "10px",
                  backgroundColor: C.bg,
                  paddingAll: "12px",
                  contents: data.details.map((d) => ({
                    type: "box" as const,
                    layout: "horizontal" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: d.label,
                        size: "xs" as const,
                        color: C.sub,
                        flex: 2,
                      },
                      {
                        type: "text" as const,
                        text: d.value,
                        size: "xs" as const,
                        color: C.text,
                        weight: "bold" as const,
                        flex: 3,
                        align: "end" as const,
                      },
                    ],
                  })),
                },
              ]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "8px",
        contents: [
          {
            type: "text",
            text: "iPED by codelabs tech",
            size: "xxs",
            color: C.muted,
            align: "center",
          },
        ],
      },
    },
  };
}

// Re-export legacy name for backward compat
export { receiptConfirmFlex as budgetAlertFlex };
