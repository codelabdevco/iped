import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Receipt from "@/models/Receipt";
import { pushMessage } from "@/lib/line-bot";
import { dailySummaryFlex } from "@/lib/line-flex";

const CRON_SECRET = process.env.CRON_SECRET || "iped-cron-secret";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Find users with daily summary enabled + LINE connected
    const users = await User.find({
      lineUserId: { $exists: true, $ne: "" },
      "settings.notifications.dailySummary": true,
      status: "active",
    }).select("_id lineUserId lineDisplayName settings.notifications.dailySummaryTime").lean();

    console.log(`[Daily Summary] Found ${users.length} users with daily summary enabled`);

    let sent = 0;
    let errors = 0;

    for (const user of users as any[]) {
      try {
        // Get today's summary
        const summary = await getDailySummary(String(user._id));

        // Skip if no activity today
        if (summary.count === 0 && summary.totalExpense === 0 && summary.totalIncome === 0) {
          console.log(`[Daily Summary] Skip ${user.lineDisplayName} — no activity`);
          continue;
        }

        // Build flex message
        const flex = dailySummaryFlex(summary);

        // Push to LINE
        await pushMessage(user.lineUserId, [
          { type: "text", text: `📊 สรุปรายวัน — ${new Date(Date.now() + 7 * 60 * 60 * 1000).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}` },
          flex,
        ]);

        sent++;
        console.log(`[Daily Summary] Sent to ${user.lineDisplayName}`);

        // Small delay to avoid LINE rate limit
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        errors++;
        console.error(`[Daily Summary] Error for ${user.lineDisplayName}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      total: users.length,
      sent,
      errors,
      skipped: users.length - sent - errors,
    });
  } catch (error: any) {
    console.error("[Daily Summary] Fatal error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getDailySummary(userId: string) {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // Bangkok time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  todayStart.setTime(todayStart.getTime() - 7 * 60 * 60 * 1000); // back to UTC

  const receipts = await Receipt.find({
    userId,
    date: { $gte: todayStart },
    status: { $nin: ["cancelled", "draft"] },
  }).lean();

  const totalExpense = receipts.filter((r: any) => r.direction !== "income" && r.direction !== "savings").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalIncome = receipts.filter((r: any) => r.direction === "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const catMap: Record<string, { icon: string; amount: number }> = {};
  for (const r of receipts as any[]) {
    if (r.direction === "income" || r.direction === "savings") continue;
    const key = r.category || "อื่นๆ";
    if (!catMap[key]) catMap[key] = { icon: r.categoryIcon || "📦", amount: 0 };
    catMap[key].amount += r.amount || 0;
  }
  const categories = Object.entries(catMap)
    .map(([name, v]) => ({ icon: v.icon, name, amount: v.amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalExpense,
    totalIncome,
    count: receipts.length,
    categories,
    date: now.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
  };
}
