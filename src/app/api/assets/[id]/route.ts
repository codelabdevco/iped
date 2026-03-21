import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Asset from "@/models/Asset";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const asset = await Asset.findById(id);
    if (!asset) return apiError("ไม่พบทรัพย์สิน", 404);

    // ── Borrow action ──
    if (body.action === "borrow") {
      if (asset.status === "borrowed") return apiError("ทรัพย์สินนี้ถูกยืมอยู่แล้ว", 400);
      asset.status = "borrowed";
      asset.currentBorrower = body.borrower || "";
      asset.currentBorrowerName = body.borrowerName || "";
      asset.borrowDate = new Date(body.borrowDate || Date.now());
      asset.expectedReturnDate = body.expectedReturnDate ? new Date(body.expectedReturnDate) : undefined;
      asset.borrowPurpose = body.purpose || "";
      asset.history.push({
        action: "borrow",
        date: new Date(),
        borrower: body.borrower,
        borrowerName: body.borrowerName,
        department: body.department || "",
        purpose: body.purpose || "",
        expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : undefined,
        conditionBefore: asset.condition,
        note: body.note || "",
      });
      await asset.save();
      return apiSuccess({ asset: { ...asset.toObject(), _id: String(asset._id) } });
    }

    // ── Return action ──
    if (body.action === "return") {
      if (asset.status !== "borrowed") return apiError("ทรัพย์สินนี้ไม่ได้ถูกยืมอยู่", 400);
      const condBefore = asset.condition;
      asset.status = "available";
      asset.condition = body.conditionAfter || asset.condition;
      asset.history.push({
        action: "return",
        date: new Date(),
        borrower: asset.currentBorrower,
        borrowerName: asset.currentBorrowerName,
        actualReturnDate: new Date(),
        conditionBefore: condBefore,
        conditionAfter: body.conditionAfter || condBefore,
        note: body.note || "",
      });
      asset.currentBorrower = undefined;
      asset.currentBorrowerName = undefined;
      asset.borrowDate = undefined;
      asset.expectedReturnDate = undefined;
      asset.borrowPurpose = undefined;
      await asset.save();
      return apiSuccess({ asset: { ...asset.toObject(), _id: String(asset._id) } });
    }

    // ── Maintenance action ──
    if (body.action === "maintenance") {
      asset.status = "maintenance";
      asset.history.push({ action: "maintenance", date: new Date(), note: body.note || "ส่งซ่อม/บำรุงรักษา" });
      await asset.save();
      return apiSuccess({ asset: { ...asset.toObject(), _id: String(asset._id) } });
    }

    // ── Retire action ──
    if (body.action === "retire") {
      asset.status = "retired";
      asset.history.push({ action: "retire", date: new Date(), note: body.note || "ปลดระวาง" });
      await asset.save();
      return apiSuccess({ asset: { ...asset.toObject(), _id: String(asset._id) } });
    }

    // ── Update info ──
    const allowed = ["name", "description", "category", "subCategory", "brand", "model", "serialNumber",
      "color", "specifications", "vendor", "invoiceNumber", "usefulLifeYears", "salvageValue",
      "depreciationMethod", "location", "department", "building", "floor", "room",
      "condition", "status", "note", "tags"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.purchaseDate) update.purchaseDate = new Date(body.purchaseDate);
    if (body.warrantyExpiry) update.warrantyExpiry = new Date(body.warrantyExpiry);
    if (body.purchasePrice !== undefined) update.purchasePrice = Number(body.purchasePrice);

    // Condition change history
    if (update.condition && update.condition !== asset.condition) {
      asset.history.push({
        action: "condition-change",
        date: new Date(),
        conditionBefore: asset.condition,
        conditionAfter: update.condition as string,
        note: body.note || "",
      });
    }

    Object.assign(asset, update);
    await asset.save();
    return apiSuccess({ asset: { ...asset.toObject(), _id: String(asset._id) } });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const { id } = await params;
    const asset = await Asset.findOneAndDelete({ _id: id, userId: session.userId });
    if (!asset) return apiError("ไม่พบทรัพย์สิน", 404);
    return apiSuccess({ deleted: true });
  });
}
