import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import { JWTPayload } from "@/lib/auth";
import Asset from "@/models/Asset";

export async function GET(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload) => {
    await connectDB();
    const query = session.orgId
      ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
      : { userId: session.userId };

    const assets = await Asset.find(query).sort({ status: 1, category: 1, name: 1 }).lean();
    const data = assets.map((a: any) => ({
      ...a,
      _id: String(a._id),
      history: (a.history || []).map((h: any) => ({ ...h, _id: String(h._id) })),
    }));
    return apiSuccess({ assets: data });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session: JWTPayload, req: NextRequest) => {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.assetCode || !body.category) {
      return apiError("กรุณากรอก: รหัสทรัพย์สิน, ชื่อ, หมวดหมู่", 400);
    }

    // Check duplicate code
    const dupQuery = session.orgId
      ? { orgId: session.orgId, assetCode: body.assetCode }
      : { userId: session.userId, assetCode: body.assetCode };
    if (await Asset.findOne(dupQuery)) {
      return apiError("รหัสทรัพย์สินซ้ำ", 400);
    }

    const purchasePrice = Number(body.purchasePrice) || 0;

    const asset = await Asset.create({
      userId: session.userId,
      orgId: session.orgId || undefined,
      assetCode: body.assetCode,
      name: body.name,
      description: body.description || "",
      category: body.category,
      subCategory: body.subCategory || "",
      brand: body.brand || "",
      model: body.model || "",
      serialNumber: body.serialNumber || "",
      color: body.color || "",
      specifications: body.specifications || "",
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
      purchasePrice,
      vendor: body.vendor || "",
      invoiceNumber: body.invoiceNumber || "",
      warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
      usefulLifeYears: Number(body.usefulLifeYears) || 5,
      salvageValue: Number(body.salvageValue) || 0,
      currentValue: purchasePrice,
      depreciationMethod: body.depreciationMethod || "straight-line",
      location: body.location || "",
      department: body.department || "",
      building: body.building || "",
      floor: body.floor || "",
      room: body.room || "",
      status: "available",
      condition: body.condition || "new",
      note: body.note || "",
      tags: body.tags || [],
      history: [{ action: "register", date: new Date(), note: "ลงทะเบียนทรัพย์สินใหม่" }],
    });

    return apiSuccess({ asset: { ...asset.toObject(), _id: String(asset._id) } }, 201);
  });
}
