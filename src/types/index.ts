// ── User Types ──
export interface UserProfile {
  _id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  roles: string[];
  accountType: "personal" | "business";
  onboardingComplete: boolean;
}

// ── Receipt Types ──
export interface ReceiptItem {
  _id: string;
  userId: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  type: "receipt" | "invoice" | "billing" | "debit_note" | "credit_note";
  source: "line" | "email" | "web";
  status: "pending" | "confirmed" | "rejected";
  vat?: number;
  wht?: number;
  paymentMethod?: string;
  imageUrl?: string;
  items?: ReceiptLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ── Dashboard Types ──
export interface DashboardStats {
  totalThisMonth: number;
  changePercent: number;
  receiptCount: number;
  receiptCountChange: number;
  averageAmount: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentReceipts: ReceiptItem[];
  categories: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
}

// ── Budget Types ──
export interface BudgetItem {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  period: "monthly" | "yearly";
}

// ── Organization Types ──
export interface OrgMember {
  userId: string;
  role: "admin" | "manager" | "accountant" | "user";
  joinedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  taxId?: string;
  vatRegistered: boolean;
  whtEnabled: boolean;
  members: OrgMember[];
}
