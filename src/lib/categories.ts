export interface Category {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  subCategories?: string[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "food",
    name: "อาหาร/เครื่องดื่ม",
    icon: "🍔",
    keywords: ["ร้านอาหาร", "กาแฟ", "cafe", "restaurant", "grab food", "food", "7-eleven", "เซเว่น", "แฟมิลี่มาร์ท", "ลอตเต้เรีย", "แมคโดนัลด์", "kfc", "pizza", "starbucks", "amazon"],
    subCategories: ["อาหาร", "เครื่องดื่ม", "ขนม", "วัตถุดิบ"],
  },
  {
    id: "transport",
    name: "เดินทาง/ขนส่ง",
    icon: "🚗",
    keywords: ["ปั๊มน้ำมัน", "ptt", "shell", "caltex", "บางจาก", "grab", "bolt", "taxi", "bts", "mrt", "ทางด่วน", "parking"],
    subCategories: ["น้ำมัน", "ค่าทางด่วน", "ที่จอดรถ", "แท็กซี่/Grab", "ขนส่งสาธารณะ"],
  },
  {
    id: "office",
    name: "สำนักงาน/อุปกรณ์",
    icon: "🏢",
    keywords: ["office", "เครื่องเขียน", "กระดาษ", "หมึกพิมพ์", "อุปกรณ์", "b2s", "officemate", "lazada", "shopee"],
    subCategories: ["เครื่องเขียน", "อุปกรณ์ IT", "เฟอร์นิเจอร์", "อื่นๆ"],
  },
  {
    id: "service",
    name: "ค่าบริการ/Subscription",
    icon: "📱",
    keywords: ["subscription", "netflix", "spotify", "true", "ais", "dtac", "internet", "เน็ต", "โทรศัพท์", "cloud", "software"],
    subCategories: ["อินเทอร์เน็ต", "โทรศัพท์", "Software", "Streaming", "อื่นๆ"],
  },
  {
    id: "utility",
    name: "สาธารณูปโภค",
    icon: "💡",
    keywords: ["ค่าไฟ", "ค่าน้ำ", "ไฟฟ้า", "ประปา", "pea", "mea", "การไฟฟ้า", "การประปา"],
    subCategories: ["ค่าไฟ", "ค่าน้ำ", "ค่าแก๊ส"],
  },
  {
    id: "health",
    name: "สุขภาพ/ประกัน",
    icon: "🏥",
    keywords: ["โรงพยาบาล", "hospital", "คลินิก", "ยา", "pharmacy", "ประกัน", "insurance", "ทันตกรรม"],
    subCategories: ["ค่ารักษา", "ค่ายา", "ประกันสุขภาพ", "ทันตกรรม"],
  },
  {
    id: "material",
    name: "วัตถุดิบ/สินค้า",
    icon: "📦",
    keywords: ["makro", "แม็คโคร", "big c", "โลตัส", "lotus", "สินค้า", "วัตถุดิบ", "ของใช้"],
    subCategories: ["วัตถุดิบ", "สินค้าสำเร็จรูป", "บรรจุภัณฑ์"],
  },
  {
    id: "rent",
    name: "ค่าเช่า/สถานที่",
    icon: "🏠",
    keywords: ["ค่าเช่า", "rent", "เช่าออฟฟิศ", "เช่าร้าน", "ส่วนกลาง"],
    subCategories: ["ค่าเช่า", "ค่าส่วนกลาง", "ค่าซ่อมแซม"],
  },
  {
    id: "other",
    name: "อื่นๆ",
    icon: "📋",
    keywords: [],
    subCategories: ["อื่นๆ"],
  },
];

export function suggestCategory(text: string): Category {
  const lowerText = text.toLowerCase();
  for (const cat of DEFAULT_CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return cat;
      }
    }
  }
  return DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}
