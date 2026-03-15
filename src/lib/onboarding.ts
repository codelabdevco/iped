import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { replyMessage } from "@/lib/line-bot";

const PRIMARY = "#FA3633";

const GOALS = [
  { label: "ติดตามค่าใช้จ่าย", icon: "📊" },
  { label: "ทำบัญชีธุรกิจ", icon: "💼" },
  { label: "ที่ปรึกษา AI", icon: "🤖" },
  { label: "วางแผนงบ", icon: "📋" },
];

// ==================== Quick Reply Helpers ====================

function quickReply(items: { label: string; text: string }[]): any {
  return {
    items: items.map((item) => ({
      type: "action",
      action: { type: "message", label: item.label, text: item.text },
    })),
  };
}

// ==================== Flex Builders ====================

function welcomeFlex(displayName: string): any {
  return {
    type: "flex",
    altText: "ยินดีต้อนรับสู่ iPED!",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "24px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ยินดีต้อนรับ! 👋",
            size: "xl",
            weight: "bold",
            color: PRIMARY,
          },
          {
            type: "text",
            text: `สวัสดีครับ ${displayName}`,
            size: "md",
            color: "#333333",
            margin: "sm",
          },
          {
            type: "text",
            text: "iPED ช่วยจัดการใบเสร็จและค่าใช้จ่ายของคุณอัตโนมัติ",
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
            color: "#E0E0E0",
          },
          {
            type: "text",
            text: "📝 ขั้นตอนที่ 1/5",
            size: "xs",
            color: "#999999",
            margin: "lg",
          },
          {
            type: "text",
            text: "กรุณาบอกชื่อของคุณ",
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "sm",
          },
          {
            type: "text",
            text: "พิมพ์ชื่อ หรือกดปุ่มด้านล่าง",
            size: "xs",
            color: "#AAAAAA",
            margin: "xs",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "8px",
        contents: [
          {
            type: "text",
            text: "Powered by codelabs tech",
            size: "xxs",
            color: "#BBBBBB",
            align: "center",
          },
        ],
      },
    },
    quickReply: quickReply([
      { label: `ใช้ชื่อ: ${displayName.substring(0, 13)}`, text: displayName },
    ]),
  };
}

function askAgeFlex(): any {
  return {
    type: "text",
    text: "📝 ขั้นตอนที่ 2/5\n\nกรุณาบอกอายุของคุณ (ตัวเลข)",
    quickReply: quickReply([
      { label: "18-24", text: "22" },
      { label: "25-34", text: "30" },
      { label: "35-44", text: "40" },
      { label: "45+", text: "50" },
    ]),
  };
}

function askGenderFlex(): any {
  return {
    type: "text",
    text: "📝 ขั้นตอนที่ 3/5\n\nเพศของคุณ",
    quickReply: quickReply([
      { label: "👨 ชาย", text: "ชาย" },
      { label: "👩 หญิง", text: "หญิง" },
      { label: "🙂 ไม่ระบุ", text: "ไม่ระบุ" },
    ]),
  };
}

function askGoalsFlex(): any {
  return {
    type: "flex",
    altText: "เลือกเป้าหมาย",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "📝 ขั้นตอนที่ 4/5",
            size: "xs",
            color: "#999999",
          },
          {
            type: "text",
            text: "ต้องการใช้ iPED ทำอะไร?",
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "sm",
          },
          {
            type: "text",
            text: "เลือกได้มากกว่า 1 ข้อ แล้วกด 'เสร็จสิ้น'",
            size: "xs",
            color: "#999999",
            wrap: true,
            margin: "xs",
          },
          { type: "separator", margin: "md", color: "#E0E0E0" },
          ...GOALS.map((g) => ({
            type: "box" as const,
            layout: "horizontal" as const,
            backgroundColor: "#F5F5F5",
            cornerRadius: "8px",
            paddingAll: "10px",
            margin: "sm",
            action: {
              type: "message" as const,
              label: g.label,
              text: g.label,
            },
            contents: [
              {
                type: "text" as const,
                text: `${g.icon} ${g.label}`,
                size: "sm" as const,
                color: "#333333",
                align: "center" as const,
              },
            ],
          })),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "8px",
        contents: [
          {
            type: "text",
            text: "Powered by codelabs tech",
            size: "xxs",
            color: "#BBBBBB",
            align: "center",
          },
        ],
      },
    },
    quickReply: quickReply([
      { label: "📊 ติดตามค่าใช้จ่าย", text: "ติดตามค่าใช้จ่าย" },
      { label: "💼 ทำบัญชีธุรกิจ", text: "ทำบัญชีธุรกิจ" },
      { label: "🤖 ที่ปรึกษา AI", text: "ที่ปรึกษา AI" },
      { label: "📋 วางแผนงบ", text: "วางแผนงบ" },
      { label: "✅ เสร็จสิ้น", text: "เสร็จสิ้น" },
    ]),
  };
}

function askOccupationFlex(): any {
  return {
    type: "text",
    text: "📝 ขั้นตอนที่ 5/5\n\nอาชีพของคุณ (ไม่บังคับ)",
    quickReply: quickReply([
      { label: "💼 พนักงานบริษัท", text: "พนักงานบริษัท" },
      { label: "🏪 เจ้าของธุรกิจ", text: "เจ้าของธุรกิจ" },
      { label: "🎓 นักศึกษา", text: "นักศึกษา" },
      { label: "💻 ฟรีแลนซ์", text: "ฟรีแลนซ์" },
      { label: "⏭️ ข้าม", text: "ข้าม" },
    ]),
  };
}

function completeFlex(name: string): any {
  return {
    type: "flex",
    altText: "ลงทะเบียนสำเร็จ!",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "24px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "✅ ลงทะเบียนสำเร็จ!",
            size: "xl",
            weight: "bold",
            color: PRIMARY,
          },
          {
            type: "text",
            text: `ยินดีต้อนรับ ${name} สู่ iPED`,
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "sm",
          },
          { type: "separator", margin: "lg", color: "#E0E0E0" },
          {
            type: "text",
            text: "📸 เริ่มต้นใช้งาน:",
            size: "sm",
            weight: "bold",
            color: "#333333",
            margin: "md",
          },
          {
            type: "text",
            text: "ส่งรูปใบเสร็จมาได้เลย!\nระบบจะอ่านและบันทึกให้อัตโนมัติ",
            size: "sm",
            color: "#555555",
            margin: "xs",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "8px",
        contents: [
          {
            type: "text",
            text: "Powered by codelabs tech",
            size: "xxs",
            color: "#BBBBBB",
            align: "center",
          },
        ],
      },
    },
  };
}

// ==================== Main Logic ====================

export async function getOrCreateUser(
  lineUserId: string,
  displayName?: string
): Promise<any> {
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
    console.log("Created new user:", lineUserId);
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

  // Already onboarded → skip
  if (user.onboardingComplete) {
    return false;
  }

  // Has documents but not marked complete → auto-complete
  if (user.documentsCount && user.documentsCount > 0) {
    await User.updateOne({ _id: user._id }, { onboardingComplete: true });
    return false;
  }

  const step = user.onboardingStep;
  const name = displayName || user.lineDisplayName || "User";

  // ===== Step 0: Welcome + ask name =====
  if (step === 0) {
    await replyMessage(replyToken, [welcomeFlex(name)]);
    user.onboardingStep = 1;
    await user.save();
    return true;
  }

  // ===== Step 1: Save name → ask age =====
  if (step === 1) {
    const inputName = text.trim();
    if (inputName) {
      user.name = inputName;
      user.lineDisplayName = displayName || user.lineDisplayName;
    }
    user.onboardingStep = 2;
    await user.save();

    await replyMessage(replyToken, [
      { type: "text", text: `👋 สวัสดี ${inputName || name}!` },
      askAgeFlex(),
    ]);
    return true;
  }

  // ===== Step 2: Save age → ask gender =====
  if (step === 2) {
    const ageNum = parseInt(text.trim());
    if (ageNum && ageNum > 0 && ageNum < 150) {
      user.age = ageNum;
    }
    user.onboardingStep = 3;
    await user.save();

    await replyMessage(replyToken, [askGenderFlex()]);
    return true;
  }

  // ===== Step 3: Save gender → ask goals =====
  if (step === 3) {
    const g = text.trim();
    if (["ชาย", "หญิง", "ไม่ระบุ", "male", "female", "other"].includes(g)) {
      const genderMap: Record<string, string> = {
        ชาย: "male",
        หญิง: "female",
        ไม่ระบุ: "other",
        male: "male",
        female: "female",
        other: "other",
      };
      user.gender = genderMap[g] || "other";
    } else {
      user.gender = "other";
    }
    user.onboardingStep = 4;
    await user.save();

    await replyMessage(replyToken, [askGoalsFlex()]);
    return true;
  }

  // ===== Step 4: Save goals → ask occupation =====
  if (step === 4) {
    const t = text.trim();

    // "เสร็จสิ้น" or "ต่อไป" → move to next step
    if (
      t === "เสร็จสิ้น" ||
      t === "ต่อไป" ||
      t === "next" ||
      t === "done"
    ) {
      if (user.goals.length === 0) user.goals.push("ติดตามค่าใช้จ่าย");
      user.onboardingStep = 5;
      await user.save();
      await replyMessage(replyToken, [askOccupationFlex()]);
      return true;
    }

    // Add goal if valid
    const validGoal = GOALS.find((g) => g.label === t);
    if (validGoal && !user.goals.includes(t)) {
      user.goals.push(t);
      await user.save();
      const goalList = user.goals.map((g: string) => `✓ ${g}`).join("\n");
      await replyMessage(replyToken, [
        {
          type: "text",
          text: `เพิ่ม "${t}" แล้ว ✅\n\nที่เลือกไว้:\n${goalList}\n\nเลือกเพิ่มหรือกด 'เสร็จสิ้น'`,
          quickReply: quickReply([
            ...GOALS.filter((g) => !user.goals.includes(g.label)).map(
              (g) => ({
                label: `${g.icon} ${g.label}`,
                text: g.label,
              })
            ),
            { label: "✅ เสร็จสิ้น", text: "เสร็จสิ้น" },
          ]),
        },
      ]);
      return true;
    }

    // Unknown text → treat as done
    if (user.goals.length === 0) user.goals.push(t || "ติดตามค่าใช้จ่าย");
    user.onboardingStep = 5;
    await user.save();
    await replyMessage(replyToken, [askOccupationFlex()]);
    return true;
  }

  // ===== Step 5: Save occupation → Complete! =====
  if (step === 5) {
    const t = text.trim();
    if (t && t !== "ข้าม" && t !== "skip") {
      user.occupation = t;
    }
    user.onboardingStep = 6;
    user.onboardingComplete = true;
    await user.save();

    await replyMessage(replyToken, [completeFlex(user.name)]);
    return true;
  }

  return false;
}
