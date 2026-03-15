import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { replyMessage } from "@/lib/line-bot";

const GOALS = [
  { label: "", icon: "" },
  { label: "", icon: "" },
  { label: " AI", icon: "" },
  { label: "", icon: "" },
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

//  Flex builders 

function welcomeFlex(displayName: string): any {
  return {
    type: "flex", altText: " iped!",
    contents: {
      type: "bubble", size: "mega",
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "lg",
        contents: [
          { type: "text", text: "! ", size: "xl", weight: "bold", color: "#0CC755" },
          { type: "text", text: ` ${displayName}`, size: "md", color: "#333333", margin: "sm" },
          { type: "text", text: " iped ", size: "sm", color: "#666666", wrap: true, margin: "md" },
          { type: "separator", margin: "lg", color: "#E0E0E0" },
          { type: "text", text: " Step 1/3", size: "xs", color: "#999999", margin: "lg" },
          { type: "text", text: " - ", size: "md", weight: "bold", color: "#333333", margin: "sm" },
          { type: "text", text: ":  ", size: "xs", color: "#AAAAAA", margin: "xs" },
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "12px", spacing: "sm",
        contents: [
          {
            type: "box", layout: "horizontal", backgroundColor: "#F0F0F0", cornerRadius: "8px", paddingAll: "10px",
            action: { type: "uri", label: "", uri: APP_URL + "/onboarding" },
            contents: [{ type: "text", text: " ", size: "xs", color: "#666666", align: "center" }],
          },
          { type: "text", text: "Powered by codelabs tech", size: "xxs", color: "#BBBBBB", align: "center", margin: "md" },
        ],
      },
    },
  };
}

function goalsFlex(): any {
  const buttons = GOALS.map(g => ({
    type: "box" as const, layout: "horizontal" as const,
    backgroundColor: "#F5F5F5", cornerRadius: "8px", paddingAll: "10px", margin: "sm",
    action: { type: "message" as const, label: g.label, text: g.label },
    contents: [{ type: "text" as const, text: `${g.icon} ${g.label}`, size: "sm" as const, color: "#333333", align: "center" as const }],
  }));
  return {
    type: "flex", altText: "",
    contents: {
      type: "bubble", size: "mega",
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "sm",
        contents: [
          { type: "text", text: " Step 2/3", size: "xs", color: "#999999" },
          { type: "text", text: " iped ?", size: "md", weight: "bold", color: "#333333", margin: "sm" },
          { type: "text", text: " ( 1  '')", size: "xs", color: "#999999", wrap: true, margin: "xs" },
          { type: "separator", margin: "md", color: "#E0E0E0" },
          ...buttons,
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "8px",
        contents: [{ type: "text", text: "Powered by codelabs tech", size: "xxs", color: "#BBBBBB", align: "center" }],
      },
    },
  };
}

function step3Flex(): any {
  return {
    type: "flex", altText: "",
    contents: {
      type: "bubble", size: "mega",
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "sm",
        contents: [
          { type: "text", text: " Step 3/3 ()", size: "xs", color: "#999999" },
          { type: "text", text: "/ ", size: "md", weight: "bold", color: "#333333", margin: "sm" },
          { type: "text", text: "  '' ", size: "xs", color: "#999999", wrap: true, margin: "xs" },
          { type: "text", text: ":  50000", size: "xs", color: "#AAAAAA", margin: "xs" },
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "12px", spacing: "sm",
        contents: [
          {
            type: "box", layout: "horizontal", backgroundColor: "#F0F0F0", cornerRadius: "8px", paddingAll: "8px",
            action: { type: "message", label: "", text: "" },
            contents: [{ type: "text", text: " ", size: "xs", color: "#888888", align: "center" }],
          },
          { type: "text", text: "Powered by codelabs tech", size: "xxs", color: "#BBBBBB", align: "center", margin: "md" },
        ],
      },
    },
  };
}

function completeFlex(name: string): any {
  return {
    type: "flex", altText: "!",
    contents: {
      type: "bubble", size: "mega",
      body: {
        type: "box", layout: "vertical", paddingAll: "20px", spacing: "md",
        contents: [
          { type: "text", text: " !", size: "xl", weight: "bold", color: "#0CC755" },
          { type: "text", text: ` ${name}  iped`, size: "sm", color: "#666666", wrap: true, margin: "sm" },
          { type: "separator", margin: "lg", color: "#E0E0E0" },
          { type: "text", text: ":", size: "sm", weight: "bold", color: "#333333", margin: "md" },
          { type: "text", text: " ", size: "sm", color: "#555555", margin: "xs" },
          { type: "text", text: "  AI", size: "sm", color: "#555555", margin: "xs" },
          { type: "text", text: " ", size: "sm", color: "#555555", margin: "xs" },
        ],
      },
      footer: {
        type: "box", layout: "vertical", paddingAll: "8px",
        contents: [{ type: "text", text: "Powered by codelabs tech", size: "xxs", color: "#BBBBBB", align: "center" }],
      },
    },
  };
}

//  Main handler 

export async function getOrCreateUser(lineUserId: string, displayName?: string): Promise<any> {
  await connectDB();
  let user = await User.findOne({ lineUserId });
  if (!user) {
    user = await User.create({
      lineUserId,
      lineDisplayName: displayName || "User",
      name: displayName || "User",
      onboardingStep: 0,
      onboardingComplete: false,
    });
  }
  return user;
}

export async function handleOnboarding(
  replyToken: string,
  userId: string,
  text: string,
  displayName?: string
): Promise<boolean> {
  const user = await getOrCreateUser(userId, displayName);

  if (user.onboardingComplete || (user.documentsCount && user.documentsCount > 0)) { if (!user.onboardingComplete) { await User.updateOne({ _id: user._id }, { onboardingComplete: true }); } return false; } // not in onboarding

  const step = user.onboardingStep;

  // Step 0: First contact  send welcome + ask name
  if (step === 0) {
    const name = displayName || "User";
    await replyMessage(replyToken, [welcomeFlex(name)]);
    user.onboardingStep = 1;
    await user.save();
    return true;
  }

  // Step 1: Received name  save & ask goals
  if (step === 1) {
    user.name = text.trim();
    user.onboardingStep = 2;
    await user.save();
    await replyMessage(replyToken, [
      { type: "text", text: ` ${text.trim()} ` },
      goalsFlex(),
    ]);
    return true;
  }

  // Step 2: Received goal selection
  if (step === 2) {
    const t = text.trim();
    if (t === "" || t === "" || t === "next") {
      if (user.goals.length === 0) user.goals.push("");
      user.onboardingStep = 3;
      await user.save();
      await replyMessage(replyToken, [step3Flex()]);
      return true;
    }
    // Add goal
    const validGoal = GOALS.find(g => g.label === t);
    if (validGoal && !user.goals.includes(t)) {
      user.goals.push(t);
      await user.save();
      await replyMessage(replyToken, [
        { type: "text", text: `  "${t}" \n "" ` },
      ]);
      return true;
    }
    // If not a valid goal, treat as "done" and move on
    if (!validGoal) {
      if (user.goals.length === 0) user.goals.push(t);
      user.onboardingStep = 3;
      await user.save();
      await replyMessage(replyToken, [step3Flex()]);
      return true;
    }
  }

  // Step 3: Business name / budget or skip
  if (step === 3) {
    const t = text.trim();
    if (t !== "" && t !== "skip") {
      // Parse: try to extract business name and budget
      const budgetMatch = t.match(/(\d[\d,]*)/);
      if (budgetMatch) {
        user.monthlyBudget = parseInt(budgetMatch[1].replace(/,/g, ""));
        user.businessName = t.replace(budgetMatch[0], "").trim() || undefined;
      } else {
        user.businessName = t;
      }
    }
    user.onboardingStep = 4;
    user.onboardingComplete = true;
    await user.save();
    await replyMessage(replyToken, [completeFlex(user.name)]);
    return true;
  }

  return false;
}
