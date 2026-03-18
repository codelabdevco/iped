export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  direction: "expense" | "income" | "savings";
  keywords: string[];
}

export const ALL_CATEGORIES: Category[] = [
  // ── รายจ่าย ──
  { id: "food", name: "อาหาร", icon: "🍜", color: "#FB923C", direction: "expense", keywords: ["ร้านอาหาร", "กาแฟ", "cafe", "restaurant", "grab food", "food", "7-eleven", "เซเว่น", "แฟมิลี่มาร์ท", "แมคโดนัลด์", "kfc", "pizza", "starbucks", "amazon", "อาหาร", "เครื่องดื่ม"] },
  { id: "transport", name: "เดินทาง", icon: "🚗", color: "#60A5FA", direction: "expense", keywords: ["ปั๊มน้ำมัน", "ptt", "shell", "caltex", "บางจาก", "grab", "bolt", "taxi", "bts", "mrt", "ทางด่วน", "parking", "เดินทาง", "ขนส่ง", "คมนาคม"] },
  { id: "shopping", name: "ช็อปปิ้ง", icon: "🛒", color: "#818CF8", direction: "expense", keywords: ["shopee", "lazada", "ช็อปปิ้ง", "ช้อปปิ้ง", "shopping", "central", "ห้าง"] },
  { id: "utility", name: "สาธารณูปโภค", icon: "💡", color: "#F472B6", direction: "expense", keywords: ["ค่าไฟ", "ค่าน้ำ", "ไฟฟ้า", "ประปา", "pea", "mea", "การไฟฟ้า", "การประปา", "true", "ais", "dtac", "internet", "เน็ต", "โทรศัพท์"] },
  { id: "home", name: "ของใช้ในบ้าน", icon: "🏠", color: "#C084FC", direction: "expense", keywords: ["makro", "แม็คโคร", "big c", "โลตัส", "lotus", "ของใช้", "วัตถุดิบ", "สินค้า", "tops"] },
  { id: "health", name: "สุขภาพ", icon: "🏥", color: "#34D399", direction: "expense", keywords: ["โรงพยาบาล", "hospital", "คลินิก", "ยา", "pharmacy", "ประกัน", "สุขภาพ", "ทันตกรรม", "watson"] },
  { id: "education", name: "การศึกษา", icon: "📚", color: "#FBBF24", direction: "expense", keywords: ["การศึกษา", "เรียน", "คอร์ส", "หนังสือ", "school", "university", "สัมมนา"] },
  { id: "entertain", name: "บันเทิง", icon: "🎬", color: "#F87171", direction: "expense", keywords: ["netflix", "spotify", "บันเทิง", "หนัง", "เกม", "ท่องเที่ยว", "กีฬา"] },
  { id: "rent", name: "ที่พัก", icon: "🏨", color: "#A78BFA", direction: "expense", keywords: ["ค่าเช่า", "rent", "เช่า", "ส่วนกลาง", "คอนโด", "ห้อง", "ที่พัก", "โรงแรม"] },
  { id: "business", name: "ธุรกิจ", icon: "💼", color: "#F59E0B", direction: "expense", keywords: ["office", "เครื่องเขียน", "อุปกรณ์", "b2s", "officemate", "ธุรกิจ", "สำนักงาน", "บัญชี"] },
  { id: "other-exp", name: "อื่นๆ", icon: "📦", color: "#94A3B8", direction: "expense", keywords: [] },

  // ── รายรับ ──
  { id: "salary", name: "เงินเดือน", icon: "💰", color: "#22c55e", direction: "income", keywords: ["เงินเดือน", "salary"] },
  { id: "freelance", name: "ฟรีแลนซ์", icon: "💻", color: "#3b82f6", direction: "income", keywords: ["ฟรีแลนซ์", "freelance", "รับจ้าง"] },
  { id: "selling", name: "ขายของ", icon: "🛍️", color: "#f59e0b", direction: "income", keywords: ["ขายของ", "ขาย", "รายได้"] },
  { id: "invest", name: "ลงทุน", icon: "📈", color: "#8b5cf6", direction: "income", keywords: ["ลงทุน", "หุ้น", "กองทุน", "ปันผล", "ดอกเบี้ย"] },
  { id: "bonus", name: "โบนัส", icon: "🎁", color: "#ec4899", direction: "income", keywords: ["โบนัส", "bonus", "รางวัล"] },
  { id: "refund", name: "คืนเงิน", icon: "↩️", color: "#14b8a6", direction: "income", keywords: ["คืนเงิน", "refund"] },
  { id: "other-inc", name: "อื่นๆ", icon: "📋", color: "#78716c", direction: "income", keywords: [] },

  // ── เงินออม ──
  { id: "travel-save", name: "ท่องเที่ยว", icon: "✈️", color: "#818CF8", direction: "savings", keywords: ["ท่องเที่ยว", "เที่ยว"] },
  { id: "emergency", name: "กองทุนฉุกเฉิน", icon: "🛡️", color: "#34D399", direction: "savings", keywords: ["ฉุกเฉิน", "สำรอง"] },
  { id: "property", name: "บ้าน/รถ", icon: "🏡", color: "#60A5FA", direction: "savings", keywords: ["บ้าน", "รถ", "ดาวน์"] },
  { id: "retire", name: "เกษียณ", icon: "🌴", color: "#F472B6", direction: "savings", keywords: ["เกษียณ"] },
  { id: "saving-gen", name: "เงินออม", icon: "🐷", color: "#ec4899", direction: "savings", keywords: ["ออม", "เก็บเงิน"] },
  { id: "other-save", name: "อื่นๆ", icon: "📋", color: "#78716c", direction: "savings", keywords: [] },
];

// Get categories by direction
export function getCategoriesByDirection(dir: "expense" | "income" | "savings") {
  return ALL_CATEGORIES.filter((c) => c.direction === dir);
}

// Find category info by name
export function getCategoryInfo(name: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.name === name);
}

// Suggest category from merchant text (for OCR)
export function suggestCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const cat of ALL_CATEGORIES.filter((c) => c.direction === "expense")) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) return cat;
    }
  }
  return ALL_CATEGORIES.find((c) => c.id === "other-exp")!;
}
