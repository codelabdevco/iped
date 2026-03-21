import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Debt from "@/models/Debt";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Add payment
    if (body.action === "payment") {
      const debt = await Debt.findById(id);
      if (!debt) return apiError("ไม่พบข้อมูลหนี้", 404);

      const paymentAmount = Number(body.amount);
      const interest = Number(body.interest) || 0;
      const principal = paymentAmount - interest;

      debt.payments.push({
        date: new Date(body.date || Date.now()),
        amount: paymentAmount,
        principal,
        interest,
        note: body.note || "",
        receiptId: body.receiptId || "",
      });

      debt.totalPaid = (debt.totalPaid || 0) + paymentAmount;
      debt.totalInterestPaid = (debt.totalInterestPaid || 0) + interest;
      debt.remainingBalance = Math.max(0, debt.remainingBalance - principal);

      if (debt.remainingBalance <= 0) {
        debt.status = "paid";
        debt.remainingBalance = 0;
      }

      await debt.save();
      return apiSuccess({ debt: { ...debt.toObject(), _id: String(debt._id) } });
    }

    // Update debt info
    const allowed = ["creditor", "creditorType", "debtType", "interestRate", "interestType",
      "monthlyPayment", "dueDate", "contractNumber", "collateral", "guarantor", "bankAccount", "status", "note"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (update.dueDate) update.dueDate = new Date(update.dueDate as string);
    if (update.interestRate) update.interestRate = Number(update.interestRate);
    if (update.monthlyPayment) update.monthlyPayment = Number(update.monthlyPayment);

    const debt = await Debt.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!debt) return apiError("ไม่พบข้อมูลหนี้", 404);

    return apiSuccess({ debt: { ...debt, _id: String(debt._id) } });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;
    const debt = await Debt.findOneAndDelete({ _id: id, userId: session.userId });
    if (!debt) return apiError("ไม่พบข้อมูลหนี้", 404);
    return apiSuccess({ deleted: true });
  });
}
