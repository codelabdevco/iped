import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { replyMessage, pushMessage, getUserProfile } from "@/lib/line-bot";

const PRIMARY = "#FA3633";

// ============ Quick Reply Helpers ============
function quickReply(items: { label: string; text: string }[]) {
  return {
    items: items.map((i) => ({
      type: "action",
      action: { type: "message", label: i.label, text: i.text },
    })),
  };
}

// ============ Flex Messages ============
function welcomeFlex(displayName: string) {
  return {
    type: "flex",
    altText: "ยินดีต้อนรับสู่ iPED!",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "🎉 ยินดีต้อนรับสู่ iPED!",
            weight: "bold",
            size: "xl",
            color: PRIMARY,
          },
          {
            type: "text",
            text: `สวัสดีคุณ ${displayName}`,
            size: "md",
            color: "#333333",
          },
          {
            type: "text",
            text: "ส่งรูปสลิปหรือใบเสร็จมาได้เลย\nเราจะช่วยบันทึกและจัดการให้ครับ 📸",
            wrap: true,
            size: "sm",
            color: "#666666",
            margin: "md",
          },
        ],
      },
    },
  };
}

function askAgeFlex() {
  return {
    type: "flex",
    altText: "ขอทราบช่วงอายุ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "📋 ก่อนเริ่มใช้งาน",
            weight: "bold",
            size: "lg",
            color: PRIMARY,
          },
          {
            type: "text",
            text: "ขอทราบข้อมูลเพิ่มเติมสักครู่นะครับ\nเพื่อให้บริการคุณได้ดียิ่งขึ้น",
            wrap: true,
            size: "sm",
            color: "#666666",
          },
          { type: "separator", margin: "lg" },
          {
            type: "text",
            text: "คุณอายุช่วงไหนครับ?",
            weight: "bold",
            size: "md",
            margin: "lg",
          },
        ],
      },
    },
    quickReply: quickReply([
      { label: "18-24 ปี", text: "18-24" },
      { label: "25-34 ปี", text: "25-34" },
      { label: "35-44 ปี", text: "35-44" },
      { label: "45+ ปี", text: "45+" },
    ]),
  };
}

function askGenderFlex() {
  return {
    type: "flex",
    altText: "ขอทราบเพศ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "เพศของคุณคือ?",
            weight: "bold",
            size: "md",
          },
        ],
      },
    },
    quickReply: quickReply([
      { label: "ชาย", text: "ชาย" },
      { label: "หญิง", text: "หญิง" },
      { label: "ไม่ระบุ", text: "ไม่ระบุเพศ" },
    ]),
  };
}

function askOccupationFlex() {
  return {
    type: "flex",
    altText: "ขอทราบอาชีพ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "อาชีพของคุณคือ?",
            weight: "bold",
            size: "md",
          },
        ],
      },
    },
    quickReply: quickReply([
      { label: "พนักงานบริษัท", text: "พนักงานบริษัท" },
      { label: "ธุรกิจส่วนตัว", text: "ธุรกิจส่วนตัว" },
      { label: "ฟรีแลนซ์", text: "ฟรีแลนซ์" },
      { label: "นักศึกษา", text: "นักศึกษา" },
    ]),
  };
}

function completeFlex(name: string, age: string, gender: string, occupation: string) {
  return {
    type: "flex",
    altText: "ลงทะเบียนสำเร็จ!",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "✅ ลงทะเบียนสำเร็จ!",
            weight: "bold",
            size: "xl",
            color: PRIMARY,
          },
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "lg",
            contents: [
              infoRow("👤 ชื่อ", name),
              infoRow("🎂 อายุ", age + " ปี"),
              infoRow("⚧ เพศ", gender),
              infoRow("💼 อาชีพ", occupation),
            ],
          },
          { type: "separator", margin: "lg" },
          {
            type: "text",
            text: "📸 ส่งรูปสลิปมาได้เลยครับ!",
            weight: "bold",
            size: "md",
            color: PRIMARY,
            margin: "lg",
            align: "center",
          },
        ],
      },
    },
  };
}

function infoRow(label: string, value: string) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: "#888888", flex: 3 },
      { type: "text", text: value, size: "sm", color: "#333333", flex: 5, weight: "bold" },
    ],
  };
}

function needRegisterFlex() {
  return {
    type: "flex",
    altText: "กรุณาลงทะเบียนก่อนใช้งาน",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "📋 ลงทะเบียนก่อนใช้งาน",
            weight: "bold",
            size: "lg",
            color: PRIMARY,
          },
          {
            type: "text",
            text: "ก่อนส่งสลิป ขอทราบข้อมูลเพิ่มเติมสักครู่นะครับ เพื่อให้บริการคุณได้ดียิ่งขึ้น",
            wrap: true,
            size: "sm",
            color: "#666666",
          },
          { type: "separator", margin: "lg" },
          {
            type: "text",
            text: "คุณอายุช่วงไหนครับ?",
            weight: "bold",
            size: "md",
            margin: "lg",
          },
        ],
      },
    },
    quickReply: quickReply([
      { label: "18-24 ปี", text: "18-24" },
      { label: "25-34 ปี", text: "25-34" },
      { label: "35-44 ปี", text: "35-44" },
      { label: "45+ ปี", text: "45+" },
    ]),
  };
}

// ============ DB Helpers ============
async function getOrCreateUser(userId: string, displayName?: string) {
  await connectDB();
  let user = await User.findOne({ lineUserId: userId });
  if (!user) {
    user = await User.create({
      lineUserId: userId,
      lineDisplayName: displayName || "User",
      name: displayName || "User",
      onboardingStep: 0,
      onboardingComplete: false,
      goals: [],
    });
  }
  return user;
}

// ============ Main Handlers ============

/**
 * Handle FOLLOW event - just send welcome
 */
export async function handleFollow(replyToken: string, userId: string) {
  let displayName = "User";
  try {
    const profile = await getUserProfile(userId);
    displayName = profile.displayName || "User";
  } catch {}

  // Create user record silently
  await getOrCreateUser(userId, displayName);

  await replyMessage(replyToken, [welcomeFlex(displayName)]);
}

/**
 * Check if user needs onboarding when they send an image
 * Returns true if onboarding is needed (caller should NOT process the image)
 */
export async function handleImageOnboarding(
  replyToken: string,
  userId: string
): Promise<boolean> {
  const user = await getOrCreateUser(userId);

  if (user.onboardingComplete) {
    return false; // User is registered, proceed with image processing
  }

  // User not registered yet - start onboarding
  // Set step to 1 (waiting for age answer)
  user.onboardingStep = 1;
  await user.save();

  // Send registration prompt with age question
  await replyMessage(replyToken, [needRegisterFlex()]);
  return true; // Caller should NOT process the image
}

/**
 * Handle logout command - reset user onboarding
 * Returns true if logout was handled
 */
export async function handleLogout(
  replyToken: string,
  userId: string
): Promise<boolean> {
  await connectDB();
  const user = await User.findOne({ lineUserId: userId });

  // User not found or hasn't started onboarding
  if (!user || (!user.onboardingComplete && user.onboardingStep === 0)) {
    await replyMessage(replyToken, [
      {
        type: "text",
        text: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e43\u0e2b\u0e49\u0e23\u0e35\u0e40\u0e0b\u0e47\u0e15\u0e04\u0e48\u0e30\n\u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e2a\u0e25\u0e34\u0e1b\u0e21\u0e32\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e40\u0e23\u0e34\u0e48\u0e21\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19",
      },
    ]);
    return true;
  }

  user.onboardingStep = 0;
  user.onboardingComplete = false;
  user.age = undefined;
  user.gender = undefined;
  user.occupation = undefined;
  await user.save();

  await replyMessage(replyToken, [
    {
      type: "flex",
      altText: "\u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1b\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "\ud83d\udc4b \u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1b\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08",
              weight: "bold",
              size: "lg",
              color: PRIMARY,
            },
            {
              type: "text",
              text: "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e16\u0e39\u0e01\u0e23\u0e35\u0e40\u0e0b\u0e47\u0e15\u0e41\u0e25\u0e49\u0e27\n\u0e2a\u0e48\u0e07\u0e23\u0e39\u0e1b\u0e2a\u0e25\u0e34\u0e1b\u0e21\u0e32\u0e43\u0e2b\u0e21\u0e48\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1b\u0e35\u0e22\u0e19\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07",
              wrap: true,
              size: "sm",
              color: "#666666",
            },
          ],
        },
      },
    },
  ]);
  return true;
}

/**
 * Handle text messages during onboarding
 * Returns true if message was handled by onboarding
 */
export async function handleOnboarding(
  replyToken: string,
  userId: string,
  text: string,
  displayName?: string
): Promise<boolean> {
  await connectDB();
  const user = await User.findOne({ lineUserId: userId });

  if (!user) return false;
  if (user.onboardingComplete) return false;
  if (user.onboardingStep === 0) return false; // Not started yet

  const t = text.trim();

  switch (user.onboardingStep) {
    // Step 1: Waiting for age
    case 1: {
      const ageMap: Record<string, number> = {
        "18-24": 21, "25-34": 30, "35-44": 40, "45+": 50,
      };
      const age = ageMap[t];
      if (!age) {
        await replyMessage(replyToken, [
          { type: "text", text: "กรุณาเลือกช่วงอายุจาก Quick Reply ด้านล่างครับ" },
          askAgeFlex(),
        ]);
        return true;
      }
      user.age = age;
      user.onboardingStep = 2;
      await user.save();
      await replyMessage(replyToken, [askGenderFlex()]);
      return true;
    }

    // Step 2: Waiting for gender
    case 2: {
      const validGenders = ["ชาย", "หญิง", "ไม่ระบุเพศ"];
      if (!validGenders.includes(t)) {
        await replyMessage(replyToken, [
          { type: "text", text: "กรุณาเลือกเพศจาก Quick Reply ด้านล่างครับ" },
          askGenderFlex(),
        ]);
        return true;
      }
      user.gender = t === "ไม่ระบุเพศ" ? "ไม่ระบุ" : t;
      user.onboardingStep = 3;
      await user.save();
      await replyMessage(replyToken, [askOccupationFlex()]);
      return true;
    }

    // Step 3: Waiting for occupation
    case 3: {
      const validOccupations = ["พนักงานบริษัท", "ธุรกิจส่วนตัว", "ฟรีแลนซ์", "นักศึกษา"];
      if (!validOccupations.includes(t)) {
        // Accept any text as occupation
        user.occupation = t;
      } else {
        user.occupation = t;
      }
      user.onboardingStep = 4;
      user.onboardingComplete = true;
      await user.save();

      const ageLabel =
        user.age <= 24 ? "18-24" : user.age <= 34 ? "25-34" : user.age <= 44 ? "35-44" : "45+";

      await replyMessage(replyToken, [
        completeFlex(
          user.lineDisplayName || user.name || "User",
          ageLabel,
          user.gender || "-",
          user.occupation || "-"
        ),
      ]);
      return true;
    }

    default:
      return false;
  }
}
