import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Debt from "@/models/Debt";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const query = session.orgId
      ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
      : { userId: session.userId };

    const debts = await Debt.find(query).sort({ status: 1, dueDate: 1 }).lean();
    const data = debts.map((d: any) => ({
      ...d,
      _id: String(d._id),
      payments: (d.payments || []).map((p: any) => ({ ...p, _id: String(p._id) })),
    }));
    return apiSuccess({ debts: data });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.creditor || !body.originalAmount || !body.startDate || !body.dueDate) {
      return apiError("กรุณากรอกข้อมูลให้ครบ: เจ้าหนี้, ยอดกู้, วันเริ่มต้น, วันครบกำหนด", 400);
    }

    const debt = await Debt.create({
      userId: session.userId,
      orgId: session.orgId || undefined,
      creditor: body.creditor,
      creditorType: body.creditorType || "bank",
      debtType: body.debtType || "term-loan",
      originalAmount: Number(body.originalAmount),
      remainingBalance: Number(body.originalAmount),
      interestRate: Number(body.interestRate) || 0,
      interestType: body.interestType || "fixed",
      monthlyPayment: Number(body.monthlyPayment) || 0,
      startDate: new Date(body.startDate),
      dueDate: new Date(body.dueDate),
      contractNumber: body.contractNumber || "",
      collateral: body.collateral || "",
      guarantor: body.guarantor || "",
      bankAccount: body.bankAccount || "",
      status: "active",
      note: body.note || "",
      files: (body.files || []).map((f: any) => ({
        name: f.name, type: f.type, size: f.size, data: f.data, uploadedAt: new Date(),
      })),
    });

    return apiSuccess({ debt: { ...debt.toObject(), _id: String(debt._id) } }, 201);
  });
}
