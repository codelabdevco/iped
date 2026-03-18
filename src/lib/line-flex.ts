/**
 * iped — LINE Flex Message Templates (v3.1)
 * Design: Brand-aligned, amount-as-hero, clear visual hierarchy
 * Theme: iPED red (#FA3633) accent
 */

// ─── Brand & Status Colors ───
const C = {
  brand: "#FA3633",
  brandBg: "#FFF0F0",

  green: "#06C755",
  greenBg: "#E8F8EE",
  amber: "#E09100",
  amberBg: "#FFF8E1",
  red: "#E53E3E",
  redBg: "#FEE2E2",
  blue: "#3B82F6",
  blueBg: "#EBF2FF",

  text: "#111111",
  textSec: "#555555",
  sub: "#999999",
  muted: "#BBBBBB",
  border: "#EEEEEE",
  bg: "#F7F7F7",
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
  // Fallback: Bangkok time (UTC+7)
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} น.`;
}

function fmtAmt(n: number): string {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Brand Data (colors from omise/banks-logo banks.json) ───
const BRANDS: Record<string, { bg: string; fg: string; label: string }> = {
  "bank-scb": { bg: "#4e2e7f", fg: "#fff", label: "SCB" },
  "bank-kbank": { bg: "#138f2d", fg: "#fff", label: "K" },
  "bank-bbl": { bg: "#1e4598", fg: "#fff", label: "BBL" },
  "bank-ktb": { bg: "#1ba5e1", fg: "#fff", label: "KTB" },
  "bank-bay": { bg: "#fec43b", fg: "#1a1a1a", label: "BAY" },
  "bank-tmb": { bg: "#1279be", fg: "#fff", label: "ttb" },
  "bank-gsb": { bg: "#eb198d", fg: "#fff", label: "GSB" },
  "bank-ghb": { bg: "#f57d23", fg: "#fff", label: "GH" },
  "bank-baac": { bg: "#4b9b1d", fg: "#fff", label: "ธกส" },
  "bank-tisco": { bg: "#12549f", fg: "#fff", label: "T" },
  "bank-kk": { bg: "#199cc5", fg: "#fff", label: "KKP" },
  "bank-lhbank": { bg: "#6d6e71", fg: "#fff", label: "LH" },
  "bank-cimb": { bg: "#7e2f36", fg: "#fff", label: "C" },
  "bank-uob": { bg: "#0b3979", fg: "#fff", label: "UOB" },
  "bank-icbc": { bg: "#c50f1c", fg: "#fff", label: "I" },
  cash: { bg: "#22c55e", fg: "#fff", label: "฿" },
  promptpay: { bg: "#1A3365", fg: "#fff", label: "PP" },
  transfer: { bg: "#6366f1", fg: "#fff", label: "โอน" },
  credit: { bg: "#818CF8", fg: "#fff", label: "CC" },
  debit: { bg: "#60A5FA", fg: "#fff", label: "DC" },
  cheque: { bg: "#78716c", fg: "#fff", label: "เช็ค" },
  "ewallet-truemoney": { bg: "#FF6600", fg: "#fff", label: "TM" },
  "ewallet-rabbit": { bg: "#00B900", fg: "#fff", label: "R" },
  "ewallet-shopee": { bg: "#EE4D2D", fg: "#fff", label: "S" },
};

// Payment method display names
const PAY_NAMES: Record<string, string> = {
  "bank-scb": "ไทยพาณิชย์",
  "bank-kbank": "กสิกร",
  "bank-bbl": "กรุงเทพ",
  "bank-ktb": "กรุงไทย",
  "bank-bay": "กรุงศรี",
  "bank-tmb": "ทีทีบี",
  "bank-gsb": "ออมสิน",
  "bank-ghb": "อาคารสงเคราะห์",
  "bank-baac": "ธ.ก.ส.",
  cash: "เงินสด",
  promptpay: "พร้อมเพย์",
  transfer: "โอนเงิน",
  credit: "บัตรเครดิต",
  debit: "บัตรเดบิต",
  cheque: "เช็ค",
  "ewallet-truemoney": "TrueMoney",
  "ewallet-rabbit": "Rabbit LINE Pay",
  "ewallet-shopee": "ShopeePay",
};

/** Build brand icon box for LINE Flex (colored circle + label text) */
function brandIconBox(key: string): any {
  const b = BRANDS[key];
  if (!b) return null;
  return {
    type: "box",
    layout: "vertical",
    flex: 0,
    width: "40px",
    height: "40px",
    cornerRadius: "20px",
    backgroundColor: b.bg,
    contents: [
      {
        type: "text",
        text: b.label,
        size: "xxs",
        color: b.fg,
        align: "center",
        gravity: "center",
        weight: "bold",
      },
    ],
  };
}

// ─── Shared Components ───

/** Brand header: iPED logo + status text */
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
      {
        type: "text",
        text: statusText,
        size: "xs",
        color: statusColor,
        weight: "bold",
        flex: 0,
        gravity: "center",
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

/** Merchant + category row (uses brand icon if paymentMethod matches) */
function merchantInfo(
  icon: string,
  name: string,
  category: string,
  opts?: { subtext?: string; paymentMethod?: string },
): any {
  // Try brand icon from paymentMethod, fallback to emoji
  const brandBox = opts?.paymentMethod ? brandIconBox(opts.paymentMethod) : null;
  const iconBox = brandBox || {
    type: "box",
    layout: "vertical",
    flex: 0,
    width: "40px",
    height: "40px",
    cornerRadius: "10px",
    backgroundColor: C.bg,
    contents: [
      { type: "filler" },
      { type: "text", text: icon, size: "sm", align: "center" },
      { type: "filler" },
    ],
  };

  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    margin: "md",
    contents: [
      iconBox,
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        contents: [
          {
            type: "text",
            text: name,
            size: "sm",
            weight: "bold",
            color: C.text,
            wrap: true,
          },
          {
            type: "text",
            text: category + (opts?.subtext ? ` · ${opts.subtext}` : ""),
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

/** Direction badge (รายจ่าย / รายรับ) */
function directionBadge(isExpense: boolean): any {
  const text = isExpense ? "รายจ่าย" : "รายรับ";
  const color = isExpense ? C.red : C.green;
  const bg = isExpense ? C.redBg : C.greenBg;
  return {
    type: "box",
    layout: "horizontal",
    flex: 0,
    cornerRadius: "12px",
    backgroundColor: bg,
    paddingStart: "10px",
    paddingEnd: "10px",
    paddingTop: "5px",
    paddingBottom: "5px",
    contents: [
      {
        type: "text",
        text,
        size: "xs",
        color,
        weight: "bold",
      },
    ],
  };
}

/** Small tag pill */
function tagPill(text: string, color: string, bg: string): any {
  return {
    type: "box",
    layout: "horizontal",
    flex: 0,
    cornerRadius: "12px",
    backgroundColor: bg,
    paddingStart: "10px",
    paddingEnd: "10px",
    paddingTop: "5px",
    paddingBottom: "5px",
    contents: [
      {
        type: "text",
        text,
        size: "xs",
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
    layout: "vertical",
    paddingAll: "10px",
    cornerRadius: "8px",
    backgroundColor: C.bg,
    margin: "lg",
    spacing: "sm",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "ความแม่นยำ",
            size: "xxs",
            color: C.sub,
            flex: 1,
          },
          {
            type: "text",
            text: `${pct}%`,
            size: "xs",
            color,
            weight: "bold",
            flex: 0,
            align: "end",
          },
        ],
      },
      {
        type: "box",
        layout: "vertical",
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

/** Separator with controlled margin */
function sep(): any {
  return { type: "separator", color: C.border, margin: "md" };
}

/** Centered icon in colored circle */
function iconCircle(emoji: string, bg: string, sizePx: string): any {
  return {
    type: "box",
    layout: "vertical",
    width: sizePx,
    height: sizePx,
    cornerRadius: `${parseInt(sizePx) / 2}px`,
    backgroundColor: bg,
    margin: "md",
    offsetStart: "0px",
    contents: [
      {
        type: "text",
        text: emoji,
        size: "sm",
        align: "center",
        gravity: "center",
      },
    ],
  };
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
          // Amount — HERO (prefix -/+ already indicates expense/income)
          amountHero(data.amount, isExpense, amtColor),

          // Merchant info
          merchantInfo(
            data.categoryIcon,
            data.merchant,
            data.category,
            { subtext: data.merchantTaxId || undefined, paymentMethod: data.paymentMethod || undefined },
          ),

          sep(),

          // Detail grid
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "md",
            contents: [
              detailItem("วันที่", fmtDate(data.date)),
              detailItem("เวลา", fmtTime(data.time)),
              detailItem("ชำระ", PAY_NAMES[data.paymentMethod || ""] || data.paymentMethod || "—"),
              ...(data.vat
                ? [detailItem("VAT", `฿${fmtAmt(data.vat)}`)]
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
                  margin: "md" as const,
                  contents: [
                    {
                      type: "text" as const,
                      text: "รายการ",
                      size: "xs" as const,
                      color: C.sub,
                    },
                    ...showItems.map((item) => ({
                      type: "text" as const,
                      text: `• ${item}`,
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
        actionBtn("แก้ไข", "secondary", C.sub, {
          url: `${APP_URL}/receipt/${data.receiptId}/edit`,
        }),
        actionBtn(
          "ยืนยัน",
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
    altText: `พบรายการซ้ำ ${data.merchant} ฿${fmtAmt(data.amount)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("🔄 พบรายการซ้ำ", C.blue, C.blueBg),
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
            { subtext: data.merchantTaxId || undefined },
          ),

          sep(),

          // Duplicate comparison box
          {
            type: "box",
            layout: "vertical",
            cornerRadius: "10px",
            backgroundColor: C.blueBg,
            paddingAll: "14px",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "พบรายการที่คล้ายกัน",
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
        actionBtn("ยกเลิก", "secondary", C.sub, {
          data: `action=cancel&id=${data.receiptId}`,
        }),
        actionBtn("บันทึกซ้ำ", "primary", C.blue, {
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
    altText: "ไม่สามารถอ่านใบเสร็จได้",
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
          // Icon in circle
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "filler" },
              {
                type: "box",
                layout: "vertical",
                flex: 0,
                width: "56px",
                height: "56px",
                cornerRadius: "28px",
                backgroundColor: C.redBg,
                contents: [
                  {
                    type: "text",
                    text: "📸",
                    size: "sm",
                    align: "center",
                    gravity: "center",
                  },
                ],
              },
              { type: "filler" },
            ],
          },
          {
            type: "text",
            text: "ไม่สามารถอ่านใบเสร็จได้",
            size: "md",
            weight: "bold",
            color: C.text,
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: "ภาพอาจไม่ชัดหรือเบลอ กรุณาถ่ายรูปใหม่ให้ชัดเจน",
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
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "เคล็ดลับถ่ายรูปใบเสร็จ",
                size: "xs",
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
              },
            ],
          },

          confidenceBar(conf, C.red),
        ],
      },
      footer: footerBox([
        actionBtn("ส่งรูปใหม่", "primary", C.brand),
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
    altText: "ภาพนี้ไม่ใช่ใบเสร็จ",
    contents: {
      type: "bubble",
      size: "mega",
      header: headerBar("ไม่ใช่ใบเสร็จ", C.amber, C.amberBg),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "md",
        contents: [
          // Icon in circle
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              { type: "filler" },
              {
                type: "box",
                layout: "vertical",
                flex: 0,
                width: "56px",
                height: "56px",
                cornerRadius: "28px",
                backgroundColor: C.amberBg,
                contents: [
                  {
                    type: "text",
                    text: "🖼️",
                    size: "sm",
                    align: "center",
                    gravity: "center",
                  },
                ],
              },
              { type: "filler" },
            ],
          },
          {
            type: "text",
            text: "ภาพนี้ไม่ใช่ใบเสร็จ",
            size: "md",
            weight: "bold",
            color: C.text,
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: "ระบบตรวจพบว่าภาพที่ส่งมาไม่ใช่เอกสารทางการเงิน",
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
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "เอกสารที่รองรับ",
                size: "xs",
                color: C.textSec,
                weight: "bold",
              },
              {
                type: "text",
                text: "• ใบเสร็จรับเงิน\n• ใบกำกับภาษี\n• สลิปโอนเงิน\n• ใบแจ้งหนี้บัตรเครดิต\n• บิลค่าน้ำ/ค่าไฟ",
                size: "xs",
                color: C.sub,
                wrap: true,
                margin: "sm",
              },
            ],
          },
        ],
      },
      footer: footerBox([
        actionBtn("ส่งรูปใบเสร็จ", "primary", C.brand),
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
    altText: `สรุปวันนี้ ฿${fmtAmt(data.totalExpense)}`,
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
            margin: "md",
            contents: [
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
                    text: "รายจ่าย",
                    size: "xs",
                    color: C.red,
                  },
                  {
                    type: "text",
                    text: `฿${fmtAmt(data.totalExpense)}`,
                    size: "md",
                    weight: "bold",
                    color: C.red,
                    margin: "sm",
                  },
                ],
              },
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
                    text: "รายรับ",
                    size: "xs",
                    color: C.green,
                  },
                  {
                    type: "text",
                    text: `฿${fmtAmt(data.totalIncome)}`,
                    size: "md",
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
            text: "หมวดหมู่",
            size: "xs",
            color: C.sub,
            margin: "md",
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
          actionBtn("ดูรายงานเพิ่มเติม", "primary", C.brand, {
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
      header: headerBar("ผู้ช่วย AI", C.brand, C.brandBg),
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
                text: `"${data.question}"`,
                size: "xs",
                color: C.sub,
                wrap: true,
              },
            ],
          },

          // Answer
          {
            type: "text",
            text: data.answer,
            size: "sm",
            color: C.text,
            wrap: true,
            margin: "md",
          },

          // Details table (if any)
          ...(data.details && data.details.length > 0
            ? [
                sep(),
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  margin: "md" as const,
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
