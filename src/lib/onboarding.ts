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

function askAgeFlex(): any {
  return {
    type: "flex",
    altText: "\u0e27\u0e31\u0e19\u0e40\u0e01\u0e34\u0e14",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "\ud83c\udf82 \u0e27\u0e31\u0e19\u0e40\u0e01\u0e34\u0e14\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13",
            weight: "bold",
            size: "lg",
            color: PRIMARY,
          },
          {
            type: "text",
            text: "\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e15\u0e31\u0e27\u0e40\u0e25\u0e02 8 \u0e2b\u0e25\u0e31\u0e01\u0e15\u0e34\u0e14\u0e01\u0e31\u0e19\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\n\u0e40\u0e0a\u0e48\u0e19 25121990 \u0e2b\u0e23\u0e37\u0e2d 25/12/1990",
            wrap: true,
            size: "sm",
            color: "#666666",
          },
        ],
      },
    },
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

export function completeFlex(name: string, age: string, gender: string, occupation: string, pictureUrl?: string, lineUserId?: string) {
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
          ...(pictureUrl ? [{ type: "box", layout: "horizontal", justifyContent: "center", contents: [{ type: "box", layout: "vertical", contents: [{ type: "image", url: pictureUrl, size: "full", aspectRatio: "1:1", aspectMode: "cover" }], width: "80px", height: "80px", cornerRadius: "40px" }] }] : []),
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

      footer: lineUserId ? {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "แก้ไขข้อมูล",
              uri: `https://iped.codelabdev.co/register?lineUserId=${lineUserId}`,
            },
            style: "primary",
            color: "#FA3633",
            height: "sm",
          },
        ],
        paddingAll: "12px",
      } : undefined,
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

function needRegisterFlex(userId?: string) {
  return {
    type: "flex",
    altText: "กรุณาลงทะเบียนก่อนใช้งาน",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [],
            height: "6px",
            backgroundColor: "#FA3633",
          },
        ],
        paddingAll: "0px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "24px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "📋",
                    size: "xxl",
                    align: "center",
                  },
                ],
                width: "52px",
                height: "52px",
                backgroundColor: "#FFF0F0",
                cornerRadius: "12px",
                justifyContent: "center",
                alignItems: "center",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "ลงทะเบียนก่อนใช้งาน",
                    weight: "bold",
                    size: "lg",
                    color: "#1a1a1a",
                  },
                  {
                    type: "text",
                    text: "ใช้เวลาไม่ถึง 1 นาที",
                    size: "xs",
                    color: "#999999",
                  },
                ],
                paddingStart: "16px",
                justifyContent: "center",
              },
            ],
          },
          {
            type: "separator",
            color: "#f0f0f0",
          },
          {
            type: "text",
            text: "ขอทราบข้อมูลเบื้องต้นสักหน่อย เพื่อให้เราช่วยจัดการค่าใช้จ่ายของคุณได้ดียิ่งขึ้นครับ",
            wrap: true,
            size: "sm",
            color: "#666666",
            lineSpacing: "6px",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "•", size: "sm", color: "#FA3633", flex: 0 },
                  { type: "text", text: " วันเกิด", size: "sm", color: "#444444" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "•", size: "sm", color: "#FA3633", flex: 0 },
                  { type: "text", text: " เพศ", size: "sm", color: "#444444" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "•", size: "sm", color: "#FA3633", flex: 0 },
                  { type: "text", text: " อาชีพ", size: "sm", color: "#444444" },
                ],
              },
            ],
            paddingStart: "8px",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "20px",
        paddingTop: "0px",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "ตกลง ลงทะเบียนเลย", text: "ตกลง" },
            style: "primary",
            color: "#FA3633",
            height: "md",
          },
          {
            type: "button",
            action: { type: "uri", label: "กรอกข้อมูลเองผ่านเว็บ", uri: `https://iped.codelabdev.co/register${userId ? `?uid=${userId}` : ""}` },
            style: "secondary",
            height: "md",
            color: "#F5F5F5",
          },
          {
            type: "button",
            action: { type: "message", label: "ยังก่อน", text: "ยังก่อน" },
            style: "link",
            color: "#999999",
            height: "sm",
          },
        ],
      },
    },
  };
}

// ============ DB Helpers ============
async function getOrCreateUser(userId: string, displayName?: string, pictureUrl?: string) {
  await connectDB();
  let user = await User.findOne({ lineUserId: userId });
  if (user) {
    let updated = false;
    if (displayName && displayName !== "User") {
      user.lineDisplayName = displayName;
      user.name = displayName;
      updated = true;
    }
    if (pictureUrl) {
      user.lineProfilePic = pictureUrl;
      updated = true;
    }
    if (updated) await user.save();
    return user;
  }
  if (!user) {
    user = await User.create({
      lineUserId: userId,
      lineDisplayName: displayName || "User",
      lineProfilePic: pictureUrl || "",
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
  let pictureUrl = "";
  try {
    const profile = await getUserProfile(userId);
    displayName = profile.displayName || "User";
    pictureUrl = profile.pictureUrl || "";
  } catch {}

  // Create user record silently
  await getOrCreateUser(userId, displayName, pictureUrl);

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

  // Auto-complete onboarding if user has filled profile data elsewhere (mobile/web)
  if (user.gender && user.occupation) {
    user.onboardingStep = 4;
    user.onboardingComplete = true;
    await user.save();
    return false; // Profile complete, proceed with image processing
  }

  // Allow image processing even without registration — just show a soft prompt once
  // Don't block the user from scanning receipts
  return false;
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
  let dn = displayName || "User";
  let picUrl = "";
  try { const p = await getUserProfile(userId); dn = p.displayName || dn; picUrl = p.pictureUrl || ""; } catch {}
  const user = await getOrCreateUser(userId, dn, picUrl);

  if (!user) return false;
  if (user.onboardingComplete) return false;

  const t = text.trim();
  // Step 0: Waiting for user to accept registration
  if (user.onboardingStep === 0) {
    if (t === "ตกลง") {
      user.onboardingStep = 1;
      await user.save();
      await replyMessage(replyToken, [askAgeFlex()]);
      return true;
    }
    if (t === "ยังก่อน") {
      await replyMessage(replyToken, [
        { type: "text", text: "ไม่เป็นไรครับ ส่งรูปสลิปมาได้เลย 📸\nเมื่อพร้อมลงทะเบียนพิมพ์ \"ตกลง\" ได้ทุกเมื่อครับ 😊" },
      ]);
      return true;
    }
    return false;
  }


  switch (user.onboardingStep) {
    // Step 1: Waiting for birthday
    case 1: {
      // Accept: 25121990, 25/12/1990, 25-12-1990, 25 12 1990
      const raw = t.replace(/[\s/\-]/g, "");
      if (!/^\d{8}$/.test(raw)) {
        await replyMessage(replyToken, [
          { type: "text", text: "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e27\u0e31\u0e19\u0e40\u0e01\u0e34\u0e14 8 \u0e2b\u0e25\u0e31\u0e01 \u0e40\u0e0a\u0e48\u0e19 25121990\n\u0e2b\u0e23\u0e37\u0e2d\u0e43\u0e2a\u0e48\u0e41\u0e1b\u0e1b 25/12/1990 \u0e01\u0e47\u0e44\u0e14\u0e49\u0e04\u0e48\u0e30" },
          askAgeFlex(),
        ]);
        return true;
      }
      const dd = parseInt(raw.substring(0, 2));
      const mm = parseInt(raw.substring(2, 4));
      const yyyy = parseInt(raw.substring(4, 8));
      const birthDate = new Date(yyyy, mm - 1, dd);
      if (
        isNaN(birthDate.getTime()) ||
        birthDate.getDate() !== dd ||
        birthDate.getMonth() !== mm - 1 ||
        yyyy < 1900 ||
        yyyy > new Date().getFullYear()
      ) {
        await replyMessage(replyToken, [
          { type: "text", text: "\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07\u0e04\u0e48\u0e30 \u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e19\u0e30\u0e04\u0e30 \u0e40\u0e0a\u0e48\u0e19 25121990" },
          askAgeFlex(),
        ]);
        return true;
      }
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const md = today.getMonth() - birthDate.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age--;
      user.age = age;
      (user as any).birthDate = birthDate;
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
        `${user.age} \u0e1b\u0e35`;

      await replyMessage(replyToken, [
        completeFlex(
          user.lineDisplayName || user.name || "User",
          ageLabel,
          user.gender || "-",
          user.occupation || "-",
          user.lineProfilePic || ""
        , user.lineUserId),
      ]);
      return true;
    }

    default:
      return false;
  }
}
