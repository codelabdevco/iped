import { connectDB } from "./mongodb";
import Receipt from "@/models/Receipt";
import Match from "@/models/Match";

/**
 * Auto-match: find potential matching receipts for a new receipt.
 * Matches by: merchant name similarity + amount + date proximity.
 */
export async function findMatches(receiptId: string, userId: string) {
  await connectDB();
  const receipt = await Receipt.findById(receiptId).lean();
  if (!receipt) return [];

  const merchant = (receipt as any).merchant || "";
  const amount = (receipt as any).amount || 0;
  const date = (receipt as any).date ? new Date((receipt as any).date) : new Date();

  // Search window: ±7 days, same user, exclude self
  const dateFrom = new Date(date);
  dateFrom.setDate(dateFrom.getDate() - 7);
  const dateTo = new Date(date);
  dateTo.setDate(dateTo.getDate() + 7);

  const source = (receipt as any).source || "web";

  // Prefer cross-source matching: email should match line/web, and vice versa
  const crossSource = source === "email" ? { $in: ["line", "web"] } : source === "line" ? { $in: ["email", "web"] } : undefined;

  const candidates = await Receipt.find({
    _id: { $ne: receiptId },
    userId,
    date: { $gte: dateFrom, $lte: dateTo },
    status: { $ne: "cancelled" },
    ...(crossSource ? { source: crossSource } : {}),
  }).lean();

  const matches: { receiptId: string; score: number; reason: string }[] = [];

  for (const cand of candidates) {
    let score = 0;
    const reasons: string[] = [];
    const candMerchant = (cand as any).merchant || "";
    const candAmount = (cand as any).amount || 0;

    // Merchant name similarity (fuzzy)
    const merchantSim = stringSimilarity(merchant, candMerchant);
    if (merchantSim > 0.4) {
      score += Math.round(merchantSim * 40);
      reasons.push(`ร้านค้าคล้าย ${Math.round(merchantSim * 100)}%`);
    }

    // Amount match (loosened: ±10%)
    if (amount > 0 && candAmount > 0) {
      const amountDiff = Math.abs(amount - candAmount) / Math.max(amount, candAmount);
      if (amountDiff === 0) {
        score += 40;
        reasons.push("ยอดตรงกัน");
      } else if (amountDiff < 0.05) {
        score += 30;
        reasons.push(`ยอดใกล้เคียง (ต่าง ${(amountDiff * 100).toFixed(1)}%)`);
      } else if (amountDiff < 0.1) {
        score += 20;
        reasons.push(`ยอดใกล้เคียง (ต่าง ${(amountDiff * 100).toFixed(1)}%)`);
      }
    }

    // Date proximity
    const candDate = (cand as any).date ? new Date((cand as any).date) : null;
    if (candDate) {
      const daysDiff = Math.abs(date.getTime() - candDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff === 0) {
        score += 20;
        reasons.push("วันเดียวกัน");
      } else if (daysDiff <= 1) {
        score += 15;
        reasons.push("ห่าง 1 วัน");
      } else if (daysDiff <= 3) {
        score += 10;
        reasons.push(`ห่าง ${Math.round(daysDiff)} วัน`);
      }
    }

    if (score >= 30) {
      matches.push({ receiptId: String((cand as any)._id), score, reason: reasons.join(" · ") });
    }
  }

  // Sort by score desc
  matches.sort((a, b) => b.score - a.score);

  // Auto-save top matches
  for (const m of matches.slice(0, 3)) {
    const exists = await Match.findOne({
      $or: [
        { receiptA: receiptId, receiptB: m.receiptId },
        { receiptA: m.receiptId, receiptB: receiptId },
      ],
    });
    if (!exists) {
      await Match.create({
        receiptA: receiptId,
        receiptB: m.receiptId,
        matchScore: m.score,
        matchType: "auto",
        matchReason: m.reason,
        status: m.score >= 80 ? "matched" : "pending",
        userId,
      });
    }
  }

  return matches;
}

/** Simple string similarity (Dice coefficient) */
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  if (al === bl) return 1;

  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };

  const aSet = bigrams(al);
  const bSet = bigrams(bl);
  let intersection = 0;
  aSet.forEach((bg) => { if (bSet.has(bg)) intersection++; });
  return (2 * intersection) / (aSet.size + bSet.size);
}
