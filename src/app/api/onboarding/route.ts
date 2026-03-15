import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, name, goals, businessName, monthlyBudget } =
      await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    const update: any = {
      name,
      goals: goals || [],
      onboardingComplete: true,
      onboardingStep: 4,
    };
    if (businessName) update.businessName = businessName;
    if (monthlyBudget) update.monthlyBudget = monthlyBudget;

    await User.findOneAndUpdate(
      { lineUserId: userId },
      { $set: update },
      { upsert: true, new: true, runValidators: false }
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Onboarding API error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
