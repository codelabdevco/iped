import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import { pushMessage } from "@/lib/line-bot";

// POST /api/receipts/[id]/reimburse — approve or pay a reimbursement
// body: { action: "approve" | "pay" | "reject", bankTransferRef?, slipImage?, note? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session) => {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { action, bankTransferRef, slipImage, note } = body;

    if (!action || !["approve", "pay", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "action ต้องเป็น approve, pay, หรือ reject" }, { status: 400 });
    }

    // Find business receipt
    const receipt = await Receipt.findOne({ _id: id, userId: session.userId, accountType: "business" });
    if (!receipt) return NextResponse.json({ success: false, error: "ไม่พบใบเสร็จ" }, { status: 404 });

    // Find original personal receipt via ref in note
    const refMatch = (receipt.note || "").match(/ref:\s*([a-f0-9]+)/);
    const originalId = refMatch ? refMatch[1] : null;
    const originalReceipt = originalId ? await Receipt.findById(originalId) : null;

    // Find the user who sent this receipt (the personal receipt owner)
    const senderUser = originalReceipt
      ? await User.findById(originalReceipt.userId).select("lineUserId lineDisplayName name").lean() as any
      : null;

    const fmtAmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (action === "approve") {
      // pending → confirmed (รอจ่าย)
      receipt.status = "confirmed";
      await receipt.save();

      // Update personal receipt note
      if (originalReceipt) {
        const oldNote = originalReceipt.note || "";
        await Receipt.findByIdAndUpdate(originalId, {
          note: oldNote.includes("อนุมัติแล้ว") ? oldNote : `${oldNote} | อนุมัติแล้ว รอจ่ายเงิน`,
        });
      }

      // Notify sender via LINE
      if (senderUser?.lineUserId) {
        try {
          await pushMessage(senderUser.lineUserId, [{
            type: "flex",
            altText: `อนุมัติเบิกจ่าย ฿${fmtAmt(receipt.amount)}`,
            contents: {
              type: "bubble",
              body: {
                type: "box", layout: "vertical", spacing: "md", paddingAll: "20px",
                contents: [
                  { type: "text", text: "✅ อนุมัติเบิกจ่ายแล้ว", weight: "bold", size: "lg", color: "#06C755" },
                  { type: "separator", margin: "lg", color: "#EEEEEE" },
                  { type: "box", layout: "horizontal", margin: "lg", contents: [
                    { type: "text", text: "รายการ", size: "sm", color: "#999999", flex: 3 },
                    { type: "text", text: receipt.merchant || "-", size: "sm", color: "#111111", flex: 5, align: "end", weight: "bold" },
                  ]},
                  { type: "box", layout: "horizontal", contents: [
                    { type: "text", text: "จำนวนเงิน", size: "sm", color: "#999999", flex: 3 },
                    { type: "text", text: `฿${fmtAmt(receipt.amount)}`, size: "sm", color: "#06C755", flex: 5, align: "end", weight: "bold" },
                  ]},
                  { type: "box", layout: "horizontal", contents: [
                    { type: "text", text: "สถานะ", size: "sm", color: "#999999", flex: 3 },
                    { type: "text", text: "รอจ่ายเงิน", size: "sm", color: "#E09100", flex: 5, align: "end", weight: "bold" },
                  ]},
                  { type: "text", text: "บริษัทอนุมัติแล้ว รอโอนเงินเข้าบัญชีของคุณ", size: "xs", color: "#999999", wrap: true, margin: "lg", align: "center" },
                ],
              },
              footer: { type: "box", layout: "horizontal", paddingAll: "12px", contents: [
                { type: "text", text: "อาซิ่ม Payroll", size: "xxs", color: "#BBBBBB" },
                { type: "text", text: "Powered by codelabs tech", size: "xxs", color: "#BBBBBB", align: "end" },
              ]},
            },
          }]);
        } catch (e) { console.error("LINE notify approve error:", e); }
      }

      return NextResponse.json({ success: true, status: "confirmed" });
    }

    if (action === "pay") {
      // confirmed → paid (จ่ายแล้ว)
      receipt.status = "paid";
      if (bankTransferRef) receipt.paymentMethod = `โอน ref: ${bankTransferRef}`;

      // Build company note
      const companyNote = [
        note || "",
        bankTransferRef ? `ref: ${bankTransferRef}` : "",
        `จ่ายเมื่อ ${new Date().toLocaleDateString("th-TH")}`,
      ].filter(Boolean).join(" • ");
      receipt.note = `${receipt.note || ""} | ${companyNote}`;

      // Save slip image from company (if provided)
      if (body.slipImage) {
        // Store as a separate field or append to existing
        receipt.set("companySlipImage", body.slipImage);
      }
      if (body.companyNote) {
        receipt.set("companyNote", body.companyNote);
      }

      await receipt.save();

      // Update personal receipt — mark as paid + add bill details + company note
      if (originalReceipt) {
        const billNote = [
          "เบิกจ่ายสำเร็จ จ่ายแล้ว",
          bankTransferRef ? `ref: ${bankTransferRef}` : "",
          `จ่ายเมื่อ ${new Date().toLocaleDateString("th-TH")}`,
          body.companyNote ? `หมายเหตุ: ${body.companyNote}` : "",
        ].filter(Boolean).join(" • ");

        const updateData: Record<string, unknown> = {
          note: `${originalReceipt.note || ""} | ${billNote}`,
          status: "paid",
        };
        // Copy company slip to personal receipt so they can see it
        if (body.slipImage) updateData.companySlipImage = body.slipImage;

        await Receipt.findByIdAndUpdate(originalId, { $set: updateData });
      }

      // Notify sender via LINE with payment details
      if (senderUser?.lineUserId) {
        try {
          await pushMessage(senderUser.lineUserId, [{
            type: "flex",
            altText: `เบิกจ่ายสำเร็จ ฿${fmtAmt(receipt.amount)} จ่ายแล้ว`,
            contents: {
              type: "bubble",
              header: { type: "box", layout: "vertical", paddingAll: "0px", contents: [
                { type: "box", layout: "vertical", contents: [], height: "6px", backgroundColor: "#06C755" },
              ]},
              body: {
                type: "box", layout: "vertical", spacing: "md", paddingAll: "20px",
                contents: [
                  { type: "text", text: "💰 เบิกจ่ายสำเร็จ!", weight: "bold", size: "xl", color: "#06C755" },
                  { type: "text", text: "บริษัทโอนเงินให้คุณเรียบร้อยแล้ว", size: "sm", color: "#666666", margin: "sm" },
                  { type: "separator", margin: "lg", color: "#EEEEEE" },
                  { type: "box", layout: "vertical", margin: "lg", spacing: "sm", contents: [
                    { type: "box", layout: "horizontal", contents: [
                      { type: "text", text: "รายการ", size: "sm", color: "#999999", flex: 3 },
                      { type: "text", text: receipt.merchant || "-", size: "sm", color: "#111111", flex: 5, align: "end", weight: "bold" },
                    ]},
                    { type: "box", layout: "horizontal", contents: [
                      { type: "text", text: "หมวดหมู่", size: "sm", color: "#999999", flex: 3 },
                      { type: "text", text: receipt.category || "-", size: "sm", color: "#111111", flex: 5, align: "end" },
                    ]},
                  ]},
                  { type: "separator", margin: "lg", color: "#EEEEEE" },
                  { type: "box", layout: "vertical", margin: "lg", contents: [
                    { type: "text", text: "ยอดที่จ่าย", size: "xs", color: "#999999", align: "center" },
                    { type: "text", text: `฿${fmtAmt(receipt.amount)}`, size: "xxl", weight: "bold", color: "#06C755", align: "center" },
                  ]},
                  ...(bankTransferRef ? [{ type: "box" as const, layout: "horizontal" as const, margin: "lg" as const, contents: [
                    { type: "text" as const, text: "Ref", size: "xs" as const, color: "#999999", flex: 2 as const },
                    { type: "text" as const, text: bankTransferRef, size: "xs" as const, color: "#111111", flex: 5 as const, align: "end" as const },
                  ]}] : []),
                  { type: "text", text: `จ่ายเมื่อ ${new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}`, size: "xxs", color: "#BBBBBB", align: "center", margin: "lg" },
                ],
              },
              footer: { type: "box", layout: "horizontal", paddingAll: "12px", contents: [
                { type: "text", text: "อาซิ่ม", size: "xxs", color: "#BBBBBB" },
                { type: "text", text: "Powered by codelabs tech", size: "xxs", color: "#BBBBBB", align: "end" },
              ]},
            },
          }]);
        } catch (e) { console.error("LINE notify pay error:", e); }
      }

      return NextResponse.json({ success: true, status: "paid" });
    }

    if (action === "reject") {
      receipt.status = "cancelled";
      if (note) receipt.note = `${receipt.note || ""} | ปฏิเสธ: ${note}`;
      await receipt.save();

      if (originalReceipt) {
        await Receipt.findByIdAndUpdate(originalId, {
          note: `${originalReceipt.note || ""} | ปฏิเสธเบิกจ่าย`,
        });
      }

      // Notify sender
      if (senderUser?.lineUserId) {
        try {
          await pushMessage(senderUser.lineUserId, [{
            type: "text",
            text: `❌ เบิกจ่ายถูกปฏิเสธ\nรายการ: ${receipt.merchant}\nจำนวน: ฿${fmtAmt(receipt.amount)}${note ? `\nเหตุผล: ${note}` : ""}`,
          }]);
        } catch (e) { console.error("LINE notify reject error:", e); }
      }

      return NextResponse.json({ success: true, status: "cancelled" });
    }

    return NextResponse.json({ success: false, error: "invalid action" }, { status: 400 });
  });
}
