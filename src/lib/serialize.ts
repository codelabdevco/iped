/**
 * Shared receipt serialization utility.
 *
 * Converts a Mongoose lean receipt document into a plain JSON-safe object
 * suitable for passing from server components to client components.
 *
 * Override individual defaults via the `defaults` parameter.
 */
export interface SerializedReceipt {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  rawDate: string;
  date: string;
  time: string;
  status: string;
  source: string;
  paymentMethod: string;
  note: string;
  hasImage: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface SerializeDefaults {
  category?: string;
  status?: string;
  /** Extra fields to merge into the output (e.g. `{ type: r.type || "receipt" }`) */
  extra?: Record<string, unknown>;
}

export function serializeReceipt(
  r: any,
  defaults?: SerializeDefaults,
): SerializedReceipt {
  return {
    _id: String(r._id),
    storeName: r.merchant || r.storeName || "ไม่ระบุ",
    amount: r.amount || 0,
    category: r.category || defaults?.category || "ไม่ระบุ",
    rawDate: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
    date: r.date ? new Date(r.date).toLocaleDateString("th-TH") : "",
    time: r.time || "",
    status: r.status || defaults?.status || "pending",
    source: r.source || "web",
    paymentMethod: r.paymentMethod || "",
    note: r.note || "",
    hasImage: !!r.imageHash,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    ...(defaults?.extra ?? {}),
  };
}
