import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/models/Payroll";
import Employee from "@/models/Employee";
import Organization from "@/models/Organization";
import { pushMessage } from "@/lib/line-bot";
import { logger } from "@/lib/logger";

// POST — generate slip + send to employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { addStamp, addSignature, sendLine, sendEmail } = body;

  await connectDB();

  const payroll = await Payroll.findById(id).lean() as any;
  if (!payroll) return NextResponse.json({ error: "ไม่พบข้อมูลเงินเดือน" }, { status: 404 });

  const org = await Organization.findById(session.orgId)
    .select("name stampImage signatureImage signatureName signaturePosition taxId address")
    .lean() as any;

  const employee = await Employee.findById(payroll.employeeId)
    .select("lineUserId email name")
    .lean() as any;

  // Build slip data
  const slipData = {
    orgName: org?.name || "",
    orgTaxId: org?.taxId || "",
    orgAddress: org?.address || "",
    employeeName: payroll.employeeName,
    employeeCode: payroll.employeeCode,
    department: payroll.department || "",
    position: payroll.position || "",
    month: payroll.month,
    year: payroll.year,
    baseSalary: payroll.baseSalary,
    overtime: payroll.overtime || { hours: 0, amount: 0 },
    allowances: payroll.allowances || [],
    bonus: payroll.bonus || 0,
    grossPay: payroll.grossPay,
    socialSecurity: payroll.socialSecurity || 0,
    providentFund: payroll.providentFund || 0,
    tax: payroll.tax || 0,
    otherDeductions: payroll.otherDeductions || [],
    totalDeductions: payroll.totalDeductions,
    netPay: payroll.netPay,
    bankName: payroll.bankName || "",
    bankAccount: payroll.bankAccount || "",
    bankTransferRef: payroll.bankTransferRef || "",
    paidAt: payroll.paidAt,
    stampImage: addStamp ? (org?.stampImage || "") : "",
    signatureImage: addSignature ? (org?.signatureImage || "") : "",
    signatureName: addSignature ? (org?.signatureName || "") : "",
    signaturePosition: addSignature ? (org?.signaturePosition || "") : "",
  };

  const results: { line: boolean; email: boolean } = { line: false, email: false };

  // Send via LINE
  if (sendLine && employee?.lineUserId) {
    try {
      const fmtAmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2 });
      const months = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

      const flexContents: any[] = [
        { type: "text", text: `สลิปเงินเดือน ${months[slipData.month]} ${slipData.year + 543}`, weight: "bold", size: "lg", color: "#111111" },
        { type: "text", text: slipData.orgName, size: "xs", color: "#999999", margin: "sm" },
        { type: "separator", margin: "lg", color: "#EEEEEE" },
        { type: "box", layout: "horizontal", margin: "lg", contents: [
          { type: "text", text: "ชื่อพนักงาน", size: "sm", color: "#999999", flex: 3 },
          { type: "text", text: slipData.employeeName, size: "sm", color: "#111111", flex: 5, align: "end", weight: "bold" },
        ]},
        { type: "box", layout: "horizontal", contents: [
          { type: "text", text: "รหัส", size: "xs", color: "#999999", flex: 3 },
          { type: "text", text: slipData.employeeCode, size: "xs", color: "#555555", flex: 5, align: "end" },
        ]},
        { type: "separator", margin: "lg", color: "#EEEEEE" },
        { type: "box", layout: "horizontal", margin: "lg", contents: [
          { type: "text", text: "เงินเดือน", size: "sm", color: "#555555", flex: 4 },
          { type: "text", text: `฿${fmtAmt(slipData.baseSalary)}`, size: "sm", color: "#111111", flex: 3, align: "end" },
        ]},
      ];

      if (slipData.overtime.amount > 0) {
        flexContents.push({ type: "box", layout: "horizontal", contents: [
          { type: "text", text: `OT (${slipData.overtime.hours}ชม.)`, size: "xs", color: "#555555", flex: 4 },
          { type: "text", text: `฿${fmtAmt(slipData.overtime.amount)}`, size: "xs", color: "#555555", flex: 3, align: "end" },
        ]});
      }

      for (const a of slipData.allowances) {
        flexContents.push({ type: "box", layout: "horizontal", contents: [
          { type: "text", text: a.type, size: "xs", color: "#555555", flex: 4 },
          { type: "text", text: `฿${fmtAmt(a.amount)}`, size: "xs", color: "#555555", flex: 3, align: "end" },
        ]});
      }

      flexContents.push(
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "เงินได้รวม", size: "sm", color: "#111111", weight: "bold", flex: 4 },
          { type: "text", text: `฿${fmtAmt(slipData.grossPay)}`, size: "sm", color: "#06C755", weight: "bold", flex: 3, align: "end" },
        ]},
        { type: "separator", margin: "lg", color: "#EEEEEE" },
      );

      if (slipData.socialSecurity > 0) {
        flexContents.push({ type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "ประกันสังคม", size: "xs", color: "#E53E3E", flex: 4 },
          { type: "text", text: `-฿${fmtAmt(slipData.socialSecurity)}`, size: "xs", color: "#E53E3E", flex: 3, align: "end" },
        ]});
      }
      if (slipData.tax > 0) {
        flexContents.push({ type: "box", layout: "horizontal", contents: [
          { type: "text", text: "ภาษี", size: "xs", color: "#E53E3E", flex: 4 },
          { type: "text", text: `-฿${fmtAmt(slipData.tax)}`, size: "xs", color: "#E53E3E", flex: 3, align: "end" },
        ]});
      }

      flexContents.push(
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "หักรวม", size: "sm", color: "#E53E3E", weight: "bold", flex: 4 },
          { type: "text", text: `-฿${fmtAmt(slipData.totalDeductions)}`, size: "sm", color: "#E53E3E", weight: "bold", flex: 3, align: "end" },
        ]},
        { type: "separator", margin: "lg", color: "#EEEEEE" },
        { type: "box", layout: "vertical", margin: "lg", contents: [
          { type: "text", text: "เงินสุทธิ", size: "xs", color: "#999999", align: "center" },
          { type: "text", text: `฿${fmtAmt(slipData.netPay)}`, size: "xxl", weight: "bold", color: "#06C755", align: "center" },
        ]},
      );

      // Add stamp/signature info
      if (slipData.signatureName) {
        flexContents.push(
          { type: "separator", margin: "lg", color: "#EEEEEE" },
          { type: "text", text: slipData.signatureName, size: "xs", color: "#555555", align: "center", margin: "lg" },
          { type: "text", text: slipData.signaturePosition || "ผู้มีอำนาจลงนาม", size: "xxs", color: "#999999", align: "center" },
        );
      }

      await pushMessage(employee.lineUserId, [{
        type: "flex",
        altText: `สลิปเงินเดือน ${months[slipData.month]} ${slipData.year + 543} — ฿${fmtAmt(slipData.netPay)}`,
        contents: {
          type: "bubble",
          size: "mega",
          header: {
            type: "box", layout: "horizontal", paddingAll: "14px", backgroundColor: "#E8F8EE",
            contents: [
              { type: "box", layout: "vertical", flex: 0, width: "24px", height: "24px", cornerRadius: "12px", backgroundColor: "#06C755", contents: [{ type: "text", text: "฿", size: "xs", color: "#FFFFFF", align: "center", gravity: "center", weight: "bold" }] },
              { type: "text", text: "สลิปเงินเดือน", size: "xs", color: "#06C755", weight: "bold", flex: 0, gravity: "center", margin: "sm" },
              { type: "filler" },
              { type: "text", text: `${months[slipData.month]} ${slipData.year + 543}`, size: "xs", color: "#06C755", weight: "bold", flex: 0, gravity: "center" },
            ],
          },
          body: { type: "box", layout: "vertical", paddingAll: "16px", spacing: "sm", contents: flexContents },
          footer: { type: "box", layout: "vertical", paddingAll: "8px", contents: [
            { type: "text", text: `${slipData.orgName} • iPED by codelabs tech`, size: "xxs", color: "#BBBBBB", align: "center" },
          ]},
        },
      }]);

      results.line = true;
      logger.info("Payroll slip sent via LINE", { payrollId: id, employee: employee.lineUserId });
    } catch (err: any) {
      logger.error("Payroll slip LINE send error", { error: err.message });
    }
  }

  return NextResponse.json({ success: true, results, slipData });
}
