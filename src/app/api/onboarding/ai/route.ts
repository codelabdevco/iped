import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const SYSTEM_PROMPT = `You are iped's AI onboarding assistant. Your job is to collect user information through friendly conversation in Thai.

You need to collect:
1. Name (required)
2. Age (required)
3. Gender - options: male, female, other (required)
4. Occupation (optional)
5. Goals - what they want to use iped for. Options: tracking expenses, business accounting, AI financial advisor, budget planning
6. Business name (optional)
7. Monthly budget (optional)

Rules:
- Always respond in Thai
- Be friendly and conversational
- Ask one thing at a time
- When you have collected at least name, age, gender and goals, summarize what you collected and confirm
- After confirmation, respond with exactly this JSON at the END of your message: {"COMPLETE":true,"name":"...","age":0,"gender":"...","occupation":"...","goals":[...],"businessName":"...","monthlyBudget":0}
- The JSON must be on its own line at the very end
- Do not output the JSON until the user confirms the summary`;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { userId, messages } = await request.json();

    if (!userId || !messages) {
      return NextResponse.json(
        { error: "userId and messages required" },
        { status: 400 }
      );
    }

    // Quota check for AI chat
    const { checkQuota, incrementUsage } = await import("@/lib/quota");
    const quota = await checkQuota(userId, "aiChat");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.message, quota }, { status: 402 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Check if AI completed data collection
    let complete = false;
    const jsonMatch = text.match(/\{"COMPLETE"\s*:\s*true.*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        // Save to DB
        const update: any = {
          name: data.name,
          goals: data.goals || [],
          onboardingComplete: true,
          onboardingStep: 4,
        };
        if (data.age) update.age = data.age;
        if (data.gender) update.gender = data.gender;
        if (data.occupation) update.occupation = data.occupation;
        if (data.businessName) update.businessName = data.businessName;
        if (data.monthlyBudget) update.monthlyBudget = data.monthlyBudget;

        await User.findOneAndUpdate(
          { lineUserId: userId },
          { $set: update },
          { upsert: true, new: true, runValidators: false }
        );
        complete = true;
      } catch {}
    }

    // Increment AI chat usage after successful response
    await incrementUsage(userId, "aiChat");

    // Clean the JSON from the displayed message
    const cleanMessage = text.replace(/\n?\{"COMPLETE"\s*:\s*true.*\}/, "").trim();

    return NextResponse.json({
      message: cleanMessage,
      complete,
    });
  } catch (e: any) {
    console.error("Onboarding AI error:", e.message);
    return NextResponse.json(
      {
        message:
          "\u0e02\u0e2d\u0e42\u0e17\u0e29\u0e04\u0e23\u0e31\u0e1b \u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14 \u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
        complete: false,
      },
      { status: 200 }
    );
  }
}
