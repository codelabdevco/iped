import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "แพ็กเกจและราคา — อาซิ่ม",
  description: "เลือกแพ็กเกจอาซิ่มที่เหมาะกับคุณ ตั้งแต่ฟรีจนถึงองค์กร",
};

/* ─── plan data ─── */

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  monthly: number | null; // null = contact
  yearly: number | null;
  popular?: boolean;
  cta: string;
  ctaStyle: "outline" | "solid";
  features: Feature[];
}

const f = (text: string, included = true): Feature => ({ text, included });

const personalPlans: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    cta: "ใช้งานฟรี",
    ctaStyle: "outline",
    features: [
      f("30 ใบเสร็จ/เดือน"),
      f("10 OCR สแกน/เดือน"),
      f("100 MB พื้นที่เก็บ"),
      f("LINE Bot แจ้งเตือน"),
      f("สรุปรายเดือน"),
      f("Gmail scan", false),
      f("Google Drive sync", false),
      f("ส่งเบิกจ่ายบริษัท", false),
      f("Export PDF/CSV", false),
      f("AI ถามตอบ", false),
    ],
  },
  {
    name: "Plus",
    monthly: 99,
    yearly: 890,
    popular: true,
    cta: "เริ่มทดลอง 14 วัน",
    ctaStyle: "solid",
    features: [
      f("300 ใบเสร็จ/เดือน"),
      f("100 OCR/เดือน"),
      f("2 GB พื้นที่"),
      f("Gmail scan"),
      f("Google Drive"),
      f("เบิกจ่าย 10 ครั้ง/เดือน"),
      f("Export CSV"),
      f("AI 10 ครั้ง/เดือน"),
      f("ไม่มีโฆษณา"),
    ],
  },
  {
    name: "Pro",
    monthly: 249,
    yearly: 2240,
    cta: "เริ่มทดลอง 14 วัน",
    ctaStyle: "solid",
    features: [
      f("ไม่จำกัดใบเสร็จ"),
      f("ไม่จำกัด OCR"),
      f("20 GB"),
      f("ทุกอย่างใน Plus"),
      f("Export PDF + CSV"),
      f("AI ไม่จำกัด"),
      f("เบิกจ่ายไม่จำกัด"),
      f("ประวัติไม่จำกัด"),
    ],
  },
];

const businessPlans: Plan[] = [
  {
    name: "Starter",
    monthly: 499,
    yearly: 4490,
    cta: "ทดลอง 30 วัน",
    ctaStyle: "outline",
    features: [
      f("500 ใบเสร็จ, 200 OCR, 5 GB"),
      f("5 พนักงาน, 3 แผนก"),
      f("อนุมัติรายจ่าย"),
      f("ใบเสนอราคา 10/เดือน"),
      f("Payroll", false),
      f("VAT/WHT", false),
    ],
  },
  {
    name: "Business",
    monthly: 1499,
    yearly: 13490,
    popular: true,
    cta: "ทดลอง 30 วัน",
    ctaStyle: "solid",
    features: [
      f("5,000 ใบเสร็จ, 2,000 OCR, 50 GB"),
      f("30 พนักงาน"),
      f("Payroll + LINE Flex สลิป"),
      f("VAT/WHT"),
      f("เชื่อมโปรแกรมบัญชี"),
      f("Google Sheets"),
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    cta: "ติดต่อฝ่ายขาย",
    ctaStyle: "solid",
    features: [
      f("ไม่จำกัดทุกอย่าง"),
      f("API Access"),
      f("SSO"),
      f("Custom workflow"),
      f("Dedicated support"),
    ],
  },
];

/* ─── sub-components (server) ─── */

function CheckIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function formatPrice(price: number | null, yearly: boolean) {
  if (price === null) return "ติดต่อ";
  if (price === 0) return "ฟรี";
  return `฿${price.toLocaleString()}`;
}

function PlanCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const price = yearly ? plan.yearly : plan.monthly;
  const isPopular = plan.popular;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 transition-all ${
        isPopular
          ? "border-[#FA3633]/60 bg-[#FA3633]/[0.04] shadow-[0_0_40px_rgba(250,54,51,0.08)]"
          : "border-white/[0.08] bg-white/[0.04]"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FA3633] px-4 py-1 text-xs font-semibold text-white tracking-wide">
          ยอดนิยม
        </span>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{formatPrice(price, yearly)}</span>
          {price !== null && price > 0 && (
            <span className="text-sm text-neutral-400">/{yearly ? "ปี" : "เดือน"}</span>
          )}
        </div>
        {yearly && plan.monthly && plan.monthly > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            เฉลี่ย ฿{Math.round((plan.yearly ?? 0) / 12).toLocaleString()}/เดือน
          </p>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/login"
        className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
          plan.ctaStyle === "solid"
            ? "bg-[#FA3633] text-white hover:bg-[#e02e2b]"
            : "border border-white/20 text-white hover:bg-white/[0.06]"
        }`}
      >
        {plan.cta}
      </Link>

      {/* Features */}
      <ul className="mt-6 flex flex-col gap-3 text-sm">
        {plan.features.map((feat, i) => (
          <li key={i} className="flex items-start gap-3">
            {feat.included ? <CheckIcon /> : <XIcon />}
            <span className={feat.included ? "text-neutral-300" : "text-neutral-600"}>{feat.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── FAQ ─── */

const faqs = [
  {
    q: "ทดลองใช้งานฟรีกี่วัน?",
    a: "แพ็กเกจส่วนตัว Plus/Pro ทดลองได้ 14 วัน แพ็กเกจบริษัท Starter/Business ทดลองได้ 30 วัน โดยไม่ต้องใส่บัตรเครดิต",
  },
  {
    q: "เปลี่ยนแพ็กเกจระหว่างทางได้ไหม?",
    a: "ได้ครับ สามารถอัปเกรดหรือดาวน์เกรดได้ตลอดเวลา ระบบจะคำนวณส่วนต่างให้อัตโนมัติ",
  },
  {
    q: "ยกเลิกได้เมื่อไหร่?",
    a: "ยกเลิกได้ทุกเมื่อ ไม่มีสัญญาผูกมัด หลังยกเลิกยังใช้งานได้จนครบรอบบิล",
  },
  {
    q: "รองรับการชำระเงินช่องทางไหนบ้าง?",
    a: "รองรับบัตรเครดิต/เดบิต, PromptPay, โอนผ่านธนาคาร และ LINE Pay",
  },
  {
    q: "ข้อมูลปลอดภัยไหม?",
    a: "ข้อมูลทั้งหมดเข้ารหัส AES-256 และเก็บบนเซิร์ฟเวอร์ในประเทศไทย เป็นไปตามมาตรฐาน PDPA",
  },
];

/* ─── page ─── */

export default function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; billing?: string }>;
}) {
  // Since this is a server component, we use searchParams for toggle state
  // Default to personal + monthly; users toggle via links with query params
  return <PricingContent searchParams={searchParams} />;
}

async function PricingContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; billing?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "business" ? "business" : "personal";
  const billing = params.billing === "yearly" ? "yearly" : "monthly";
  const plans = tab === "business" ? businessPlans : personalPlans;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#FA3633]">อา</span>ซิ่ม
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white/[0.08] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.12] transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-400 sm:text-lg">
            จัดการใบเสร็จอัจฉริยะด้วย AI เริ่มต้นฟรี อัปเกรดเมื่อพร้อม
          </p>
        </div>

        {/* Tab: personal / business */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
            <Link
              href={`/pricing?tab=personal&billing=${billing}`}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                tab === "personal"
                  ? "bg-white/[0.1] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              ส่วนตัว
            </Link>
            <Link
              href={`/pricing?tab=business&billing=${billing}`}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                tab === "business"
                  ? "bg-white/[0.1] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              บริษัท
            </Link>
          </div>
        </div>

        {/* Toggle: monthly / yearly */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={`/pricing?tab=${tab}&billing=monthly`}
            className={`text-sm font-medium transition-colors ${
              billing === "monthly" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            รายเดือน
          </Link>
          <Link
            href={`/pricing?tab=${tab}&billing=${billing === "monthly" ? "yearly" : "monthly"}`}
            className="relative flex h-7 w-12 items-center rounded-full bg-white/[0.1] p-0.5 transition-colors"
            aria-label="Toggle billing period"
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-[#FA3633] transition-transform ${
                billing === "yearly" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </Link>
          <Link
            href={`/pricing?tab=${tab}&billing=yearly`}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              billing === "yearly" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            รายปี
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              ประหยัด 25%
            </span>
          </Link>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} yearly={billing === "yearly"} />
          ))}
        </div>

        {/* FAQ */}
        <section className="mt-24">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">คำถามที่พบบ่อย</h2>
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/[0.06]">
            {faqs.map((faq, i) => (
              <div key={i} className="py-6">
                <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-white/[0.06] pt-8 text-center">
          <p className="text-sm text-neutral-500">
            Powered by{" "}
            <span className="font-medium text-neutral-400">codelabs tech</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
