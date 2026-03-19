/**
 * Payroll Notification Service
 * Sends LINE Flex messages and emails when payroll status changes
 */
import { pushMessage } from "./line-bot";

const C = {
  brand: "#FA3633",
  green: "#06C755",
  greenBg: "#E8F8EE",
  blue: "#3B82F6",
  blueBg: "#EBF2FF",
  amber: "#E09100",
  text: "#111111",
  textSec: "#555555",
  sub: "#999999",
  border: "#EEEEEE",
  bg: "#F7F7F7",
  white: "#FFFFFF",
};

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function fmtAmt(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskAccount(acc: string): string {
  if (!acc || acc.length < 4) return acc || "-";
  return "xxx-" + acc.slice(-4);
}

// ─── Bank Colors ───
const BANK_COLORS: Record<string, string> = {
  "กสิกรไทย": "#138f2d",
  "กรุงเทพ": "#1e4598",
  "ไทยพาณิชย์": "#4e2e7f",
  "กรุงไทย": "#1ba5e1",
  "ทหารไทยธนชาต": "#1279be",
  "ออมสิน": "#eb198d",
  "กรุงศรี": "#fec43b",
};

function getBankColor(bankName: string): string {
  return BANK_COLORS[bankName] || C.blue;
}

// ─── Detail Row ───
function detailRow(label: string, value: string, color?: string) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "xs", color: C.sub, flex: 4 },
      { type: "text", text: value, size: "xs", color: color || C.text, flex: 5, align: "end", weight: "bold" },
    ],
  };
}

// ─── Separator ───
function sep() {
  return { type: "separator", color: C.border, margin: "lg" };
}

interface PayrollData {
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  month: number;
  year: number;
  baseSalary: number;
  overtime: { hours: number; amount: number };
  allowances: { type: string; amount: number }[];
  bonus: number;
  grossPay: number;
  socialSecurity: number;
  providentFund: number;
  tax: number;
  otherDeductions: { type: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
  bankName: string;
  bankAccount: string;
  bankTransferRef?: string;
  paidAt?: Date;
}

// ═══════════════════════════════════════
// LINE Flex: สลิปเงินเดือน (จ่ายแล้ว)
// ═══════════════════════════════════════
export function payrollPaidFlex(data: PayrollData) {
  const periodText = `${THAI_MONTHS[data.month - 1]} ${data.year + 543}`;
  const bankColor = getBankColor(data.bankName);

  const earningsRows: any[] = [
    detailRow("เงินเดือน", `฿${fmtAmt(data.baseSalary)}`),
  ];
  if (data.overtime.amount > 0) {
    earningsRows.push(detailRow(`OT ${data.overtime.hours} ชม.`, `฿${fmtAmt(data.overtime.amount)}`));
  }
  for (const a of data.allowances) {
    earningsRows.push(detailRow(a.type, `฿${fmtAmt(a.amount)}`));
  }
  if (data.bonus > 0) {
    earningsRows.push(detailRow("โบนัส", `฿${fmtAmt(data.bonus)}`));
  }

  const deductionRows: any[] = [];
  if (data.socialSecurity > 0) {
    deductionRows.push(detailRow("ประกันสังคม", `-฿${fmtAmt(data.socialSecurity)}`, "#E53E3E"));
  }
  if (data.providentFund > 0) {
    deductionRows.push(detailRow("กองทุนสำรอง", `-฿${fmtAmt(data.providentFund)}`, "#E53E3E"));
  }
  if (data.tax > 0) {
    deductionRows.push(detailRow("ภาษี ณ ที่จ่าย", `-฿${fmtAmt(data.tax)}`, "#E53E3E"));
  }
  for (const d of data.otherDeductions) {
    deductionRows.push(detailRow(d.type, `-฿${fmtAmt(d.amount)}`, "#E53E3E"));
  }

  return {
    type: "flex",
    altText: `สลิปเงินเดือน ${periodText} — ฿${fmtAmt(data.netPay)}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [],
            height: "6px",
            backgroundColor: C.green,
          },
        ],
        paddingAll: "0px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "24px",
        contents: [
          // Title
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "💰", size: "xl", align: "center" },
                ],
                width: "44px",
                height: "44px",
                backgroundColor: C.greenBg,
                cornerRadius: "12px",
                justifyContent: "center",
                alignItems: "center",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "สลิปเงินเดือน", weight: "bold", size: "lg", color: C.text },
                  { type: "text", text: periodText, size: "xs", color: C.sub },
                ],
                paddingStart: "14px",
                justifyContent: "center",
              },
            ],
          },
          // Status badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✓ จ่ายแล้ว", size: "xs", color: C.green, weight: "bold", align: "center" },
                ],
                backgroundColor: C.greenBg,
                cornerRadius: "20px",
                paddingAll: "6px",
                paddingStart: "14px",
                paddingEnd: "14px",
              },
            ],
          },
          sep(),
          // Employee info
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              detailRow("ชื่อ", data.employeeName),
              detailRow("รหัส", data.employeeCode),
              ...(data.department ? [detailRow("แผนก", data.department)] : []),
              ...(data.position ? [detailRow("ตำแหน่ง", data.position)] : []),
            ],
          },
          sep(),
          // Net pay hero
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "ยอดรับสุทธิ", size: "xs", color: C.sub, align: "center" },
              { type: "text", text: `฿${fmtAmt(data.netPay)}`, size: "xxl", weight: "bold", color: C.green, align: "center" },
            ],
            paddingTop: "8px",
            paddingBottom: "8px",
          },
          sep(),
          // Earnings section
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "รายได้", size: "sm", weight: "bold", color: C.text },
              ...earningsRows,
              detailRow("รวมรายได้", `฿${fmtAmt(data.grossPay)}`, C.blue),
            ],
          },
          // Deductions section
          ...(deductionRows.length > 0
            ? [
                sep(),
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  spacing: "sm" as const,
                  contents: [
                    { type: "text" as const, text: "รายการหัก", size: "sm" as const, weight: "bold" as const, color: C.text },
                    ...deductionRows,
                    detailRow("รวมหัก", `-฿${fmtAmt(data.totalDeductions)}`, "#E53E3E"),
                  ],
                },
              ]
            : []),
          sep(),
          // Bank info
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: (data.bankName || "ธนาคาร").substring(0, 3), size: "xxs", color: "#fff", align: "center", weight: "bold" },
                ],
                width: "32px",
                height: "32px",
                backgroundColor: bankColor,
                cornerRadius: "8px",
                justifyContent: "center",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: data.bankName || "ธนาคาร", size: "xs", color: C.text, weight: "bold" },
                  { type: "text", text: maskAccount(data.bankAccount), size: "xxs", color: C.sub },
                ],
                paddingStart: "10px",
                justifyContent: "center",
              },
              ...(data.bankTransferRef
                ? [{
                    type: "text" as const,
                    text: `Ref: ${data.bankTransferRef}`,
                    size: "xxs" as const,
                    color: C.sub,
                    align: "end" as const,
                    gravity: "center" as const,
                    flex: 0 as const,
                  }]
                : []),
            ],
          },
          // Paid date
          ...(data.paidAt
            ? [{
                type: "text" as const,
                text: `จ่ายเมื่อ ${new Date(data.paidAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`,
                size: "xxs" as const,
                color: C.sub,
                align: "center" as const,
                margin: "md" as const,
              }]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "อาซิ่ม Payroll", size: "xxs", color: C.sub, flex: 1 },
              { type: "text", text: "Powered by codelabs tech", size: "xxs", color: C.sub, align: "end" },
            ],
          },
        ],
        paddingAll: "16px",
        paddingTop: "0px",
      },
    },
  };
}

// ═══════════════════════════════════════
// LINE Flex: แจ้งอนุมัติเงินเดือน
// ═══════════════════════════════════════
export function payrollApprovedFlex(data: PayrollData) {
  const periodText = `${THAI_MONTHS[data.month - 1]} ${data.year + 543}`;

  return {
    type: "flex",
    altText: `เงินเดือน ${periodText} ได้รับอนุมัติแล้ว`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [],
            height: "6px",
            backgroundColor: C.blue,
          },
        ],
        paddingAll: "0px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "24px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "✅", size: "xl", align: "center" },
                ],
                width: "44px",
                height: "44px",
                backgroundColor: C.blueBg,
                cornerRadius: "12px",
                justifyContent: "center",
                alignItems: "center",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "เงินเดือนอนุมัติแล้ว", weight: "bold", size: "lg", color: C.text },
                  { type: "text", text: periodText, size: "xs", color: C.sub },
                ],
                paddingStart: "14px",
                justifyContent: "center",
              },
            ],
          },
          sep(),
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              detailRow("ชื่อ", data.employeeName),
              detailRow("รหัส", data.employeeCode),
              detailRow("เงินเดือน", `฿${fmtAmt(data.baseSalary)}`),
              detailRow("ยอดรับสุทธิ", `฿${fmtAmt(data.netPay)}`, C.green),
            ],
          },
          sep(),
          {
            type: "text",
            text: "เงินเดือนของคุณได้รับการอนุมัติแล้ว\nรอการโอนเงินเข้าบัญชี",
            size: "sm",
            color: C.textSec,
            wrap: true,
            align: "center",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "อาซิ่ม Payroll", size: "xxs", color: C.sub, flex: 1 },
              { type: "text", text: "Powered by codelabs tech", size: "xxs", color: C.sub, align: "end" },
            ],
          },
        ],
        paddingAll: "16px",
        paddingTop: "0px",
      },
    },
  };
}

// ═══════════════════════════════════════
// Email: Payroll HTML template
// ═══════════════════════════════════════
export function payrollEmailHtml(data: PayrollData, type: "approved" | "paid"): string {
  const periodText = `${THAI_MONTHS[data.month - 1]} ${data.year + 543}`;
  const title = type === "paid" ? "สลิปเงินเดือน" : "เงินเดือนอนุมัติแล้ว";
  const color = type === "paid" ? "#06C755" : "#3B82F6";

  const earningsHtml = [
    `<tr><td>เงินเดือน</td><td style="text-align:right">฿${fmtAmt(data.baseSalary)}</td></tr>`,
    ...(data.overtime.amount > 0 ? [`<tr><td>OT ${data.overtime.hours} ชม.</td><td style="text-align:right">฿${fmtAmt(data.overtime.amount)}</td></tr>`] : []),
    ...data.allowances.map(a => `<tr><td>${a.type}</td><td style="text-align:right">฿${fmtAmt(a.amount)}</td></tr>`),
    ...(data.bonus > 0 ? [`<tr><td>โบนัส</td><td style="text-align:right">฿${fmtAmt(data.bonus)}</td></tr>`] : []),
  ].join("");

  const deductionsHtml = [
    ...(data.socialSecurity > 0 ? [`<tr><td>ประกันสังคม</td><td style="text-align:right;color:#e53e3e">-฿${fmtAmt(data.socialSecurity)}</td></tr>`] : []),
    ...(data.providentFund > 0 ? [`<tr><td>กองทุนสำรอง</td><td style="text-align:right;color:#e53e3e">-฿${fmtAmt(data.providentFund)}</td></tr>`] : []),
    ...(data.tax > 0 ? [`<tr><td>ภาษี ณ ที่จ่าย</td><td style="text-align:right;color:#e53e3e">-฿${fmtAmt(data.tax)}</td></tr>`] : []),
    ...data.otherDeductions.map(d => `<tr><td>${d.type}</td><td style="text-align:right;color:#e53e3e">-฿${fmtAmt(d.amount)}</td></tr>`),
  ].join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Sarabun',sans-serif;background:#f5f5f5;padding:24px;margin:0">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="height:6px;background:${color}"></div>
  <div style="padding:32px 24px">
    <h1 style="font-size:20px;color:#111;margin:0 0 4px">${title}</h1>
    <p style="color:#999;font-size:14px;margin:0">${periodText}</p>
    <div style="text-align:center;padding:20px 0;margin:16px 0;background:${type === "paid" ? "#e8f8ee" : "#ebf2ff"};border-radius:12px">
      <div style="font-size:12px;color:#999">ยอดรับสุทธิ</div>
      <div style="font-size:32px;font-weight:bold;color:${color}">฿${fmtAmt(data.netPay)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="color:#999;padding:4px 0">ชื่อ</td><td style="text-align:right;font-weight:bold;padding:4px 0">${data.employeeName}</td></tr>
      <tr><td style="color:#999;padding:4px 0">รหัส</td><td style="text-align:right;padding:4px 0">${data.employeeCode}</td></tr>
      ${data.department ? `<tr><td style="color:#999;padding:4px 0">แผนก</td><td style="text-align:right;padding:4px 0">${data.department}</td></tr>` : ""}
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <h3 style="font-size:14px;margin:0 0 8px;color:#111">รายได้</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${earningsHtml}
      <tr style="border-top:1px solid #eee"><td style="padding:8px 0;font-weight:bold">รวมรายได้</td><td style="text-align:right;font-weight:bold;color:#3b82f6;padding:8px 0">฿${fmtAmt(data.grossPay)}</td></tr>
    </table>
    ${deductionsHtml ? `
    <h3 style="font-size:14px;margin:16px 0 8px;color:#111">รายการหัก</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${deductionsHtml}
      <tr style="border-top:1px solid #eee"><td style="padding:8px 0;font-weight:bold">รวมหัก</td><td style="text-align:right;font-weight:bold;color:#e53e3e;padding:8px 0">-฿${fmtAmt(data.totalDeductions)}</td></tr>
    </table>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <div style="font-size:12px;color:#999">ธนาคาร: ${data.bankName} ${maskAccount(data.bankAccount)}</div>
    ${data.bankTransferRef ? `<div style="font-size:12px;color:#999">Ref: ${data.bankTransferRef}</div>` : ""}
  </div>
  <div style="padding:12px 24px;background:#f9f9f9;text-align:center;font-size:11px;color:#bbb">
    อาซิ่ม Payroll — Powered by codelabs tech
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════
// Send Notifications
// ═══════════════════════════════════════
export async function sendPayrollNotification(
  payrollData: PayrollData,
  type: "approved" | "paid",
  channels: { lineUserId?: string; email?: string }
) {
  const results: { line?: boolean; email?: boolean } = {};

  // Send LINE Flex
  if (channels.lineUserId) {
    try {
      const flex = type === "paid"
        ? payrollPaidFlex(payrollData)
        : payrollApprovedFlex(payrollData);
      await pushMessage(channels.lineUserId, [flex]);
      results.line = true;
    } catch (err) {
      console.error("Payroll LINE notification error:", err);
      results.line = false;
    }
  }

  // Send Email (skip if nodemailer not installed or SMTP not configured)
  if (channels.email && process.env.SMTP_HOST) {
    try {
      // Dynamic import — only works if nodemailer is installed
      let nodemailer: any;
      try { nodemailer = require("nodemailer"); } catch { nodemailer = null; }
      if (!nodemailer) { results.email = false; return results; }
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const periodText = `${THAI_MONTHS[payrollData.month - 1]} ${payrollData.year + 543}`;
      const subject = type === "paid"
        ? `สลิปเงินเดือน ${periodText} — ฿${fmtAmt(payrollData.netPay)}`
        : `เงินเดือน ${periodText} อนุมัติแล้ว`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@codelabdev.co",
        to: channels.email,
        subject,
        html: payrollEmailHtml(payrollData, type),
      });
      results.email = true;
    } catch (err) {
      console.error("Payroll email notification error:", err);
      results.email = false;
    }
  }

  return results;
}
