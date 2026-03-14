/**
 * iPED — LINE Flex Message Templates
 * Design: Minimal, clean, consistent color tone
 * Brand Palette:
 *   Primary: #FACC15 (yellow-400)
 *   Black:   #111111
 *   Success: #16A34A (green)
 *   Danger:  #DC2626 (red)
 *   Text:    #111111 (black)
 *   Sub:     #6B7280 (gray)
 *   BG:      #F9FAFB (light gray)
 *   White:   #FFFFFF
 */

const COLORS = {
  primary: "#FACC15",
  primaryLight: "#FEF9C3",
  primaryDark: "#111111",
  success: "#16A34A",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  text: "#111111",
  sub: "#6B7280",
  border: "#E5E7EB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  black: "#111111",
};

/** Receipt confirmation flex after OCR */
export function receiptConfirmFlex(data: {
  merchant: string;
  date: string;
  amount: number;
  vat?: number;
  category: string;
  categoryIcon: string;
  confidence: number;
  receiptId: string;
  webAppUrl: string;
}) {
  return {
    type: "flex",
    altText: `ใบเสร็จ ${data.merchant} ฿${data.amount.toLocaleString()}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "iPED",
                size: "xs",
                color: COLORS.sub,
              },
              {
                type: "text",
                text: "อ่านใบเสร็จสำเร็จ",
                size: "md",
                weight: "bold",
                color: COLORS.text,
              },
            ],
            flex: 1,
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `${data.confidence}%`,
                size: "xs",
                color: COLORS.primary,
                align: "center",
              },
            ],
            backgroundColor: COLORS.primaryLight,
            cornerRadius: "xl",
            paddingAll: "6px",
            width: "48px",
            height: "24px",
            justifyContent: "center",
          },
        ],
        backgroundColor: COLORS.white,
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Merchant
          {
            type: "text",
            text: data.merchant,
            size: "lg",
            weight: "bold",
            color: COLORS.text,
            wrap: true,
          },
          // Separator
          {
            type: "separator",
            margin: "lg",
            color: COLORS.border,
          },
          // Details
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "วันที่", size: "sm", color: COLORS.sub, flex: 2 },
                  { type: "text", text: data.date, size: "sm", color: COLORS.text, flex: 3, align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "หมวด", size: "sm", color: COLORS.sub, flex: 2 },
                  { type: "text", text: `${data.categoryIcon} ${data.category}`, size: "sm", color: COLORS.text, flex: 3, align: "end" },
                ],
              },
              ...(data.vat
                ? [
                    {
                      type: "box" as const,
                      layout: "horizontal" as const,
                      contents: [
                        { type: "text" as const, text: "VAT 7%", size: "sm" as const, color: COLORS.sub, flex: 2 },
                        { type: "text" as const, text: `฿${data.vat.toLocaleString()}`, size: "sm" as const, color: COLORS.text, flex: 3, align: "end" as const },
                      ],
                    },
                  ]
                : []),
            ],
          },
          // Separator
          {
            type: "separator",
            margin: "lg",
            color: COLORS.border,
          },
          // Total
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              { type: "text", text: "รวม", size: "md", weight: "bold", color: COLORS.text, flex: 2 },
              { type: "text", text: `฿${data.amount.toLocaleString()}`, size: "xl", weight: "bold", color: COLORS.primary, flex: 3, align: "end" },
            ],
          },
        ],
        backgroundColor: COLORS.white,
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            action: {
              type: "postback",
              label: "✅ ยืนยัน",
              data: `action=confirm&id=${data.receiptId}`,
            },
            style: "primary",
            color: COLORS.success,
            height: "sm",
          },
          {
            type: "button",
            action: {
              type: "uri",
              label: "✏️ แก้ไข",
              uri: `${data.webAppUrl}/receipt/${data.receiptId}`,
            },
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "16px",
        backgroundColor: COLORS.bg,
      },
    },
  };
}

/** Daily summary flex */
export function dailySummaryFlex(data: {
  date: string;
  totalAmount: number;
  count: number;
  budget?: number;
  topCategory: { icon: string; name: string; amount: number };
  items: { merchant: string; amount: number; icon: string }[];
}) {
  const budgetPercent = data.budget ? Math.round((data.totalAmount / data.budget) * 100) : null;
  const remaining = data.budget ? data.budget - data.totalAmount : null;

  return {
    type: "flex",
    altText: `สรุปวันนี้: ฿${data.totalAmount.toLocaleString()} จาก ${data.count} รายการ`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📊 สรุปรายจ่ายวันนี้ — iPED", size: "md", weight: "bold", color: COLORS.primary },
          { type: "text", text: data.date, size: "xs", color: "#9CA3AF", margin: "sm" },
        ],
        backgroundColor: COLORS.black,
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Total
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: `฿${data.totalAmount.toLocaleString()}`, size: "xxl", weight: "bold", color: COLORS.text, align: "center" },
              { type: "text", text: `${data.count} รายการ`, size: "sm", color: COLORS.sub, align: "center", margin: "sm" },
            ],
            paddingAll: "16px",
          },
          // Budget bar (if set)
          ...(budgetPercent !== null && remaining !== null
            ? [
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  contents: [
                    {
                      type: "box" as const,
                      layout: "horizontal" as const,
                      contents: [
                        { type: "text" as const, text: `งบ: ฿${data.budget!.toLocaleString()}`, size: "xs" as const, color: COLORS.sub },
                        {
                          type: "text" as const,
                          text: remaining >= 0 ? `เหลือ ฿${remaining.toLocaleString()}` : `เกิน ฿${Math.abs(remaining).toLocaleString()}`,
                          size: "xs" as const,
                          color: remaining >= 0 ? COLORS.success : COLORS.danger,
                          align: "end" as const,
                        },
                      ],
                    },
                    {
                      type: "box" as const,
                      layout: "vertical" as const,
                      contents: [
                        {
                          type: "box" as const,
                          layout: "vertical" as const,
                          contents: [] as any[],
                          backgroundColor: budgetPercent > 90 ? COLORS.danger : budgetPercent > 70 ? COLORS.warning : COLORS.success,
                          width: `${Math.min(budgetPercent, 100)}%`,
                          height: "6px",
                          cornerRadius: "md",
                        },
                      ],
                      backgroundColor: COLORS.border,
                      height: "6px",
                      cornerRadius: "md",
                      margin: "sm" as const,
                    },
                  ],
                  margin: "md" as const,
                  paddingStart: "16px",
                  paddingEnd: "16px",
                },
              ]
            : []),
          // Separator
          { type: "separator", margin: "lg", color: COLORS.border },
          // Items
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "md",
            contents: data.items.slice(0, 5).map((item) => ({
              type: "box" as const,
              layout: "horizontal" as const,
              contents: [
                { type: "text", text: `${item.icon} ${item.merchant}`, size: "sm", color: COLORS.text, flex: 3, wrap: false },
                { type: "text", text: `฿${item.amount.toLocaleString()}`, size: "sm", color: COLORS.text, flex: 1, align: "end" as const },
              ],
            })),
          },
          // Top category
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            backgroundColor: COLORS.bg,
            cornerRadius: "md",
            paddingAll: "10px",
            contents: [
              { type: "text", text: "ใช้มากสุด", size: "xs", color: COLORS.sub, flex: 2 },
              { type: "text", text: `${data.topCategory.icon} ${data.topCategory.name} ฿${data.topCategory.amount.toLocaleString()}`, size: "xs", color: COLORS.text, flex: 3, align: "end" },
            ],
          },
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "📊 ดูรายละเอียดทั้งหมด",
              uri: "https://app.iped.co/history",
            },
            style: "primary",
            color: COLORS.black,
            height: "sm",
          },
        ],
        paddingAll: "16px",
        backgroundColor: COLORS.bg,
      },
    },
  };
}

/** Budget alert flex */
export function budgetAlertFlex(data: {
  category: string;
  categoryIcon: string;
  spent: number;
  budget: number;
  percent: number;
  level: "warning" | "danger" | "exceeded";
}) {
  const color = data.level === "exceeded" ? COLORS.danger : data.level === "danger" ? COLORS.danger : COLORS.warning;
  const bgColor = data.level === "exceeded" ? COLORS.dangerLight : data.level === "danger" ? COLORS.dangerLight : COLORS.warningLight;
  const emoji = data.level === "exceeded" ? "🚫" : data.level === "danger" ? "🔴" : "⚠️";
  const message =
    data.level === "exceeded"
      ? `เกินงบ ฿${(data.spent - data.budget).toLocaleString()}`
      : `เหลืออีก ฿${(data.budget - data.spent).toLocaleString()}`;

  return {
    type: "flex",
    altText: `${emoji} งบ${data.category}: ${message}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `${emoji} แจ้งเตือนงบ`, size: "sm", weight: "bold", color },
            ],
          },
          {
            type: "text",
            text: `${data.categoryIcon} ${data.category}`,
            size: "lg",
            weight: "bold",
            color: COLORS.text,
            margin: "md",
          },
          {
            type: "text",
            text: message,
            size: "sm",
            color,
            margin: "sm",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [],
                backgroundColor: color,
                width: `${Math.min(data.percent, 100)}%`,
                height: "6px",
                cornerRadius: "md",
              },
            ],
            backgroundColor: COLORS.border,
            height: "6px",
            cornerRadius: "md",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            contents: [
              { type: "text", text: `฿${data.spent.toLocaleString()}`, size: "xs", color: COLORS.sub },
              { type: "text", text: `/ ฿${data.budget.toLocaleString()}`, size: "xs", color: COLORS.sub, align: "end" },
            ],
          },
        ],
        paddingAll: "16px",
        backgroundColor: bgColor,
      },
    },
  };
}

/** Duplicate warning flex */
export function duplicateWarningFlex(data: {
  merchant: string;
  amount: number;
  originalDate: string;
  receiptId: string;
}) {
  return {
    type: "flex",
    altText: `⚠️ ใบเสร็จ ${data.merchant} อาจซ้ำ`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "⚠️ ใบเสร็จนี้อาจซ้ำ", size: "sm", weight: "bold", color: COLORS.warning },
          {
            type: "text",
            text: `${data.merchant} ฿${data.amount.toLocaleString()}`,
            size: "md",
            weight: "bold",
            color: COLORS.text,
            margin: "md",
          },
          {
            type: "text",
            text: `เคยบันทึกเมื่อ ${data.originalDate}`,
            size: "xs",
            color: COLORS.sub,
            margin: "sm",
          },
        ],
        paddingAll: "16px",
        backgroundColor: COLORS.warningLight,
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            action: { type: "postback", label: "บันทึกซ้ำ", data: `action=force_save&id=${data.receiptId}` },
            style: "secondary",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "postback", label: "ยกเลิก", data: `action=cancel&id=${data.receiptId}` },
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "12px",
        backgroundColor: COLORS.bg,
      },
    },
  };
}

/** Chat AI response flex */
export function chatResponseFlex(data: {
  question: string;
  answer: string;
  details?: { label: string; value: string }[];
}) {
  return {
    type: "flex",
    altText: data.answer,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🤖", size: "lg" },
              { type: "text", text: data.answer, size: "sm", color: COLORS.text, wrap: true, flex: 5, margin: "md" },
            ],
          },
          ...(data.details
            ? [
                { type: "separator" as const, margin: "lg" as const, color: COLORS.border },
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  margin: "lg" as const,
                  spacing: "sm" as const,
                  contents: data.details.map((d) => ({
                    type: "box" as const,
                    layout: "horizontal" as const,
                    contents: [
                      { type: "text" as const, text: d.label, size: "xs" as const, color: COLORS.sub, flex: 2 },
                      { type: "text" as const, text: d.value, size: "xs" as const, color: COLORS.text, flex: 3, align: "end" as const },
                    ],
                  })),
                },
              ]
            : []),
        ],
        paddingAll: "16px",
      },
    },
  };
}
