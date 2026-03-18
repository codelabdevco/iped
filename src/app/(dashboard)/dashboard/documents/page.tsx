import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const documents = await DocumentModel.find({
    userId: session.userId,
    type: { $in: ["tax_invoice", "quotation", "invoice", "billing", "debit_note", "credit_note"] },
  })
    .sort({ date: -1 })
    .limit(100)
    .lean();

  // Count stats
  let confirmed = 0;
  let pending = 0;
  for (const d of documents) {
    if (d.status === "confirmed" || d.status === "paid") confirmed++;
    else if (d.status === "pending") pending++;
  }

  const serialized = documents.map((d) => ({
    _id: String(d._id),
    type: d.type,
    merchant: d.merchant,
    category: d.category,
    categoryIcon: d.categoryIcon || "📄",
    date: d.date.toISOString(),
    amount: d.amount,
    status: d.status,
    documentNumber: d.documentNumber || undefined,
  }));

  return (
    <DocumentsClient
      documents={serialized}
      stats={{ total: documents.length, confirmed, pending }}
    />
  );
}
