"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ScanLine, Receipt, BarChart3, Bot, Shield, Zap,
  ChevronRight, Check, Star, ArrowRight, Smartphone,
  Camera, FileText, PieChart, Bell, Users,
  Sparkles, Globe, CreditCard, ChevronDown,
} from "lucide-react";

/* ─── brand tokens ─── */
const RED = "#FA3633";
const GREEN = "#06C755";
const DARK = "#0a0a0a";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.06)";

/* ─── animated counter ─── */
function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setVal(end); clearInterval(timer); }
            else setVal(Math.floor(start));
          }, 16);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── fade-in on scroll ─── */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── interactive demo ─── */
const DEMO_STEPS = [
  { icon: Camera, title: "ถ่ายรูปสลิป", desc: "ส่งรูปสลิปหรือใบเสร็จผ่าน LINE Bot", img: "📸" },
  { icon: Sparkles, title: "AI อ่านอัตโนมัติ", desc: "Claude Vision แยกร้านค้า ยอดเงิน หมวดหมู่", img: "🤖" },
  { icon: FileText, title: "บันทึกทันที", desc: "ใบเสร็จเข้าระบบพร้อมจัดหมวดอัตโนมัติ", img: "📋" },
  { icon: PieChart, title: "ดูสรุปรายจ่าย", desc: "แดชบอร์ดสรุปยอดแบบเรียลไทม์", img: "📊" },
];

function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % DEMO_STEPS.length), 3000);
    return () => clearInterval(t);
  }, [auto]);

  const handleClick = (i: number) => { setStep(i); setAuto(false); };
  const current = DEMO_STEPS[step];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Phone mockup */}
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Phone */}
        <div className="relative w-[280px] h-[560px] rounded-[40px] border-[3px] border-white/10 bg-[#111] p-3 shadow-2xl shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#111] rounded-b-2xl z-10" />
          <div className="w-full h-full rounded-[32px] bg-[#0a0a0a] overflow-hidden flex flex-col">
            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <span className="text-[10px] text-white/40">อาซิ่ม</span>
              <div className="flex gap-1">
                <div className="w-3 h-1.5 rounded-sm bg-white/20" />
                <div className="w-3 h-1.5 rounded-sm bg-white/20" />
                <div className="w-3 h-1.5 rounded-sm bg-white/20" />
              </div>
            </div>

            {/* Content area — animated */}
            <div className="flex-1 px-4 py-3 flex flex-col gap-3 transition-all duration-500">
              {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fadeIn">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl">📸</div>
                  <div className="w-48 h-32 rounded-xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                    <Camera size={24} className="text-white/30" />
                    <span className="text-[11px] text-white/30">ส่งรูปสลิปมาเลย</span>
                  </div>
                  <div className="mt-2 px-4 py-2 rounded-full text-[11px] font-medium" style={{ backgroundColor: GREEN, color: "white" }}>
                    ส่งผ่าน LINE Bot
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="flex-1 flex flex-col gap-3 animate-fadeIn">
                  <div className="text-[11px] text-white/40 text-center mt-4">กำลังวิเคราะห์...</div>
                  <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${RED}20` }}>🤖</div>
                  <div className="space-y-2 mt-2">
                    {["ร้านค้า: 7-Eleven", "ยอด: ฿156.00", "หมวด: 🛒 ช็อปปิ้ง", "วันที่: 21 มี.ค. 69"].map((line, i) => (
                      <div key={i} className="h-8 rounded-lg bg-white/5 border border-white/8 flex items-center px-3 text-[11px] text-white/70"
                        style={{ animation: `slideRight 0.4s ease ${i * 150}ms both` }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 justify-center mt-2">
                    <div className="h-1 w-16 rounded-full overflow-hidden bg-white/10">
                      <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: RED, width: "92%" }} />
                    </div>
                    <span className="text-[10px] text-white/40">92% confidence</span>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="flex-1 flex flex-col gap-2 animate-fadeIn pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RED }} />
                    <span className="text-[11px] font-medium text-white/70">บันทึกสำเร็จ</span>
                  </div>
                  {[
                    { m: "7-Eleven", a: "฿156", cat: "🛒", d: "21 มี.ค.", s: "confirmed" },
                    { m: "Grab", a: "฿89", cat: "🚗", d: "21 มี.ค.", s: "confirmed" },
                    { m: "แม็คโคร", a: "฿1,230", cat: "🛒", d: "20 มี.ค.", s: "pending" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                      style={{ animation: `slideRight 0.3s ease ${i * 100}ms both` }}>
                      <span className="text-lg">{r.cat}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-white/80 truncate">{r.m}</div>
                        <div className="text-[10px] text-white/30">{r.d}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-bold text-red-400">{r.a}</div>
                        <div className={`text-[9px] ${r.s === "confirmed" ? "text-green-400" : "text-yellow-400"}`}>
                          {r.s === "confirmed" ? "✓ ยืนยัน" : "● รอตรวจ"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="flex-1 flex flex-col gap-3 animate-fadeIn pt-3">
                  <div className="text-center">
                    <div className="text-[10px] text-white/30 mb-1">ยอดเดือนนี้</div>
                    <div className="text-2xl font-bold" style={{ color: RED }}>฿12,450</div>
                    <div className="text-[10px] text-green-400 mt-0.5">▼ 15% จากเดือนก่อน</div>
                  </div>
                  {/* Mini chart */}
                  <div className="flex items-end justify-center gap-1.5 h-20 px-4">
                    {[40, 65, 55, 80, 45, 70, 50].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{
                        height: `${h}%`,
                        backgroundColor: i === 5 ? RED : "rgba(255,255,255,0.08)",
                        animation: `growUp 0.5s ease ${i * 80}ms both`,
                      }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: "🍜", label: "อาหาร", val: "฿4,200" },
                      { icon: "🚗", label: "เดินทาง", val: "฿3,100" },
                      { icon: "🛒", label: "ช็อปปิ้ง", val: "฿2,800" },
                      { icon: "💡", label: "สาธารณูปโภค", val: "฿2,350" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-sm">{c.icon}</span>
                        <div>
                          <div className="text-[10px] text-white/40">{c.label}</div>
                          <div className="text-[11px] font-medium text-white/70">{c.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-around py-2 border-t border-white/[0.06]">
              {[
                { icon: "🏠", label: "หน้าหลัก" },
                { icon: "🧾", label: "ใบเสร็จ" },
                { icon: "📷", label: "สแกน" },
                { icon: "📊", label: "สรุป" },
                { icon: "👤", label: "โปรไฟล์" },
              ].map((tab, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-sm">{tab.icon}</span>
                  <span className={`text-[8px] ${i === step ? "text-white/70" : "text-white/20"}`}>{tab.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          {DEMO_STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 w-full lg:w-80 ${
                step === i
                  ? "bg-white/[0.06] border-white/[0.12] shadow-lg"
                  : "bg-transparent border-white/[0.04] hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  step === i ? "text-white" : "text-white/30"
                }`}
                style={{ backgroundColor: step === i ? `${RED}20` : "rgba(255,255,255,0.04)" }}
              >
                <s.icon size={20} />
              </div>
              <div>
                <div className={`text-sm font-semibold transition-colors ${step === i ? "text-white" : "text-white/50"}`}>
                  {i + 1}. {s.title}
                </div>
                <div className={`text-xs transition-colors ${step === i ? "text-white/60" : "text-white/25"}`}>
                  {s.desc}
                </div>
              </div>
              {step === i && (
                <div className="ml-auto">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RED }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    { q: "ใช้ฟรีได้จริงหรือ?", a: "ได้เลย! แพ็กเกจ Free ให้สแกน OCR 10 ครั้ง/เดือน, บันทึก 30 ใบเสร็จ, LINE Bot, แจ้งเตือนสรุปรายวัน ไม่มีค่าใช้จ่ายใดๆ" },
    { q: "ต้องลงทะเบียนก่อนใช้งานไหม?", a: "ไม่ต้อง! แค่เพิ่มเพื่อน LINE Bot แล้วส่งรูปสลิปมาได้เลย ระบบจะสร้างบัญชีให้อัตโนมัติ" },
    { q: "ข้อมูลปลอดภัยไหม?", a: "ปลอดภัย — ข้อมูลเข้ารหัส AES-256, token ปลอดภัย, rate limiting ป้องกัน abuse, ผ่าน security audit 95/100" },
    { q: "รองรับใบเสร็จภาษาอะไรบ้าง?", a: "รองรับทั้งไทยและอังกฤษ รวมถึงสลิปโอนเงิน PromptPay ใบกำกับภาษี และ e-receipt" },
    { q: "ใช้งานกับบริษัทได้ไหม?", a: "ได้! แพ็กเกจ Business รองรับหลายคนในองค์กร ระบบเบิกจ่าย อนุมัติ และ payroll" },
  ];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {faqs.map((f, i) => (
        <button
          key={i}
          onClick={() => setOpen(open === i ? null : i)}
          className="w-full text-left p-4 rounded-xl border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-white/80">{f.q}</span>
            <ChevronDown size={16} className={`text-white/30 transition-transform duration-300 shrink-0 ${open === i ? "rotate-180" : ""}`} />
          </div>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: open === i ? "200px" : "0", opacity: open === i ? 1 : 0, marginTop: open === i ? "8px" : "0" }}
          >
            <p className="text-xs text-white/50 leading-relaxed">{f.a}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── main landing page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: DARK }}>
      <style jsx global>{`
        @keyframes slideRight { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes growUp { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease both; }
      `}</style>

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/landingpage" className="flex items-center gap-2.5">
            <img src="/logo-cropped.png" alt="อาซิ่ม" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-base">อาซิ่ม</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-[13px] text-white/50">
            <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a>
            <a href="#demo" className="hover:text-white transition-colors">สาธิต</a>
            <a href="#business" className="hover:text-white transition-colors">ธุรกิจ</a>
            <a href="#pricing" className="hover:text-white transition-colors">ราคา</a>
            <a href="#faq" className="hover:text-white transition-colors">คำถาม</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-xl text-[13px] font-medium text-white/60 hover:text-white transition-colors">
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors"
              style={{ backgroundColor: RED }}
            >
              เริ่มใช้ฟรี
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${RED}40, transparent 70%)` }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] mb-6">
              <Sparkles size={14} style={{ color: RED }} />
              <span className="text-[12px] text-white/60">ใช้ฟรี ไม่ต้องลงทะเบียน</span>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              จัดการใบเสร็จ
              <br />
              <span style={{ color: RED }}>อัจฉริยะ</span> ด้วย AI
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mt-5 text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              ถ่ายรูปสลิป — AI อ่านให้ — บันทึกอัตโนมัติ
              <br className="hidden sm:block" />
              สรุปรายรับรายจ่ายแบบเรียลไทม์ ผ่าน LINE Bot
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: RED }}
              >
                เริ่มใช้งานฟรี <ArrowRight size={18} />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base text-white/60 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
              >
                <Smartphone size={18} /> ดูสาธิต
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="mt-10 flex items-center justify-center gap-8 text-[13px] text-white/30">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> ฟรี ไม่มีบัตรเครดิต</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> เริ่มใช้ใน 10 วินาที</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-green-400" /> ปลอดภัย 100%</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-12 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { val: 10, suffix: " ครั้ง/เดือน", label: "OCR ฟรี" },
            { val: 30, suffix: " ใบ/เดือน", label: "ใบเสร็จฟรี" },
            { val: 95, suffix: "/100", label: "Security Score" },
            { val: 100, suffix: " MB", label: "พื้นที่เก็บฟรี" },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: RED }}>
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold">ทำได้ทุกอย่าง<span style={{ color: RED }}>ในที่เดียว</span></h2>
              <p className="mt-3 text-white/40 text-sm">จัดการใบเสร็จ รายรับ รายจ่าย เงินออม ทั้งส่วนตัวและบริษัท</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: ScanLine, title: "AI OCR สแกนสลิป", desc: "ถ่ายรูปหรือส่งรูปสลิป — AI อ่านร้านค้า ยอดเงิน วันที่ หมวดหมู่ ให้อัตโนมัติ", accent: RED },
              { icon: Bot, title: "LINE Bot อัจฉริยะ", desc: "ส่งรูปสลิปผ่าน LINE — ได้ผลลัพธ์ทันที พร้อมยืนยันและจัดหมวด", accent: GREEN },
              { icon: BarChart3, title: "แดชบอร์ดเรียลไทม์", desc: "สรุปรายรับ-รายจ่าย กราฟรายเดือน หมวดหมู่ยอดนิยม วิธีชำระเงิน", accent: "#3B82F6" },
              { icon: Bell, title: "สรุปรายวันอัตโนมัติ", desc: "รับสรุปค่าใช้จ่ายวันนี้ผ่าน LINE ทุกวัน 20:00 น.", accent: "#F59E0B" },
              { icon: Shield, title: "ปลอดภัยระดับสูง", desc: "เข้ารหัส AES-256, rate limiting, security audit 95/100", accent: "#8B5CF6" },
              { icon: Users, title: "ระบบบริษัท", desc: "เชื่อมพนักงาน ส่งเบิกจ่าย อนุมัติ Payroll ในระบบเดียว", accent: "#06B6D4" },
              { icon: Globe, title: "Gmail & Drive Sync", desc: "สแกนใบเสร็จจาก Gmail อัตโนมัติ + backup ไฟล์ลง Google Drive", accent: "#EF4444" },
              { icon: Receipt, title: "จัดหมวดอัตโนมัติ", desc: "ระบบเรียนรู้ร้านค้าที่คุณใช้บ่อย และจัดหมวดให้ทันที", accent: "#10B981" },
              { icon: CreditCard, title: "แยกวิธีชำระเงิน", desc: "PromptPay, บัตรเครดิต, โอนธนาคาร, e-wallet — แยกให้อัตโนมัติ", accent: "#F97316" },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 60} className="group">
                <div className="h-full p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${f.accent}15` }}>
                    <f.icon size={20} style={{ color: f.accent }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 mb-1">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE DEMO ─── */}
      <section id="demo" className="py-20 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold">ลองดู<span style={{ color: RED }}>วิธีใช้งาน</span></h2>
              <p className="mt-3 text-white/40 text-sm">4 ขั้นตอนง่ายๆ จากสลิปสู่รายงาน</p>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <InteractiveDemo />
          </FadeIn>
        </div>
      </section>

      {/* ─── BUSINESS SECTION ─── */}
      <section id="business" className="py-20 px-4 border-t border-white/[0.04] relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
          style={{ background: `radial-gradient(circle, #3B82F6, transparent 70%)` }} />

        <div className="relative max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-5">
                <Users size={14} className="text-blue-400" />
                <span className="text-[12px] text-blue-300/80">สำหรับองค์กร</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">ระบบจัดการ<span className="text-blue-400">สำหรับบริษัท</span></h2>
              <p className="mt-3 text-white/40 text-sm max-w-lg mx-auto">เชื่อมต่อพนักงานเข้าองค์กร จัดการเบิกจ่าย อนุมัติ และ Payroll ในระบบเดียว</p>
            </div>
          </FadeIn>

          {/* How it works — company flow */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16">
            {/* Left: Flow diagram */}
            <FadeIn>
              <div className="space-y-4">
                {[
                  { step: "1", icon: "🏢", title: "สร้างองค์กร", desc: "ผู้ดูแลสร้างบริษัทในระบบ รับรหัสเชิญอัตโนมัติ", color: "#3B82F6" },
                  { step: "2", icon: "🔗", title: "เชิญพนักงาน", desc: "แชร์รหัสเชิญ — พนักงานพิมพ์ \"เชื่อม XXXX\" ใน LINE Bot หรือกรอกในแอป", color: "#8B5CF6" },
                  { step: "3", icon: "🧾", title: "พนักงานส่งสลิป", desc: "สแกนสลิปตามปกติ แล้วกด \"ส่งเข้าบริษัท\" — ใบเสร็จคัดลอกเข้าบัญชีธุรกิจ", color: "#06B6D4" },
                  { step: "4", icon: "✅", title: "บริษัทอนุมัติ + จ่ายเงิน", desc: "ผู้ดูแลเห็นรายการเบิกจ่าย → อนุมัติ → โอนเงิน → พนักงานได้รับแจ้งเตือนผ่าน LINE", color: "#10B981" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: `${item.color}15` }}>
                        {item.icon}
                      </div>
                      {i < 3 && <div className="w-px h-6 bg-white/[0.08] mt-1" />}
                    </div>
                    <div className="pt-1">
                      <div className="text-sm font-semibold text-white/90">{item.title}</div>
                      <div className="text-xs text-white/40 leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Right: Business features cards */}
            <FadeIn delay={200}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📋", title: "เบิกจ่าย", desc: "พนักงานส่งใบเสร็จเข้าบริษัท รอผู้ดูแลอนุมัติ", stat: "อนุมัติผ่าน LINE" },
                  { icon: "💰", title: "Payroll", desc: "คำนวณเงินเดือน ค่าล่วงเวลา ภาษี ประกันสังคม", stat: "สลิปเงินเดือนอัตโนมัติ" },
                  { icon: "👥", title: "จัดการทีม", desc: "เพิ่มพนักงาน กำหนดแผนก ตำแหน่ง สิทธิ์การเข้าถึง", stat: "รหัสเชิญ 1 คลิก" },
                  { icon: "📊", title: "รายงานบริษัท", desc: "สรุปค่าใช้จ่ายทั้งองค์กร แยกแผนก หมวดหมู่ พนักงาน", stat: "Dashboard เรียลไทม์" },
                  { icon: "🧾", title: "ใบกำกับภาษี", desc: "บันทึกเลขประจำตัวผู้เสียภาษี VAT WHT อัตโนมัติ", stat: "OCR อ่านให้ทันที" },
                  { icon: "🔔", title: "แจ้งเตือนทาง LINE", desc: "อนุมัติ/จ่ายเงิน → พนักงานได้รับ Flex Message ทันที", stat: "Real-time notification" },
                ].map((card, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                    style={{ animation: `fadeIn 0.5s ease ${i * 80}ms both` }}>
                    <span className="text-xl">{card.icon}</span>
                    <div className="text-[13px] font-semibold text-white/85 mt-2">{card.title}</div>
                    <div className="text-[11px] text-white/35 leading-relaxed mt-1">{card.desc}</div>
                    <div className="mt-2 text-[10px] font-medium text-blue-400/70">{card.stat}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Business CTA */}
          <FadeIn delay={300}>
            <div className="text-center p-8 rounded-2xl border border-blue-500/10 bg-blue-500/[0.03]">
              <h3 className="text-xl font-bold mb-2">พร้อมเชื่อมต่อทีมของคุณ?</h3>
              <p className="text-sm text-white/40 mb-5">แพ็กเกจ Business เริ่มต้น ฿499/เดือน รองรับ 20 พนักงาน</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "#3B82F6" }}
                >
                  ดูแพ็กเกจธุรกิจ <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white/60 border border-white/[0.12] hover:bg-white/[0.06] transition-colors"
                >
                  ทดลองใช้ฟรีก่อน
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── PRICING (compact) ─── */}
      <section id="pricing" className="py-20 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold">เริ่มต้น<span style={{ color: RED }}>ฟรี</span></h2>
              <p className="mt-3 text-white/40 text-sm">อัปเกรดเมื่อพร้อม ไม่มีค่าใช้จ่ายแอบแฝง</p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: "Free", price: "฿0", period: "/เดือน", popular: false,
                features: ["10 OCR/เดือน", "30 ใบเสร็จ", "100 MB", "LINE Bot", "สรุปรายวัน"],
                cta: "เริ่มใช้ฟรี", ctaStyle: "outline" as const,
              },
              {
                name: "Plus", price: "฿99", period: "/เดือน", popular: true,
                features: ["100 OCR/เดือน", "300 ใบเสร็จ", "2 GB", "Gmail scan", "AI Chat 10 ครั้ง"],
                cta: "ทดลอง 14 วัน", ctaStyle: "solid" as const,
              },
              {
                name: "Pro", price: "฿249", period: "/เดือน", popular: false,
                features: ["ไม่จำกัด OCR", "ไม่จำกัดใบเสร็จ", "20 GB", "ทุกอย่างใน Plus", "AI ไม่จำกัด"],
                cta: "ทดลอง 14 วัน", ctaStyle: "outline" as const,
              },
            ].map((plan, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className={`relative p-5 rounded-2xl border transition-all ${
                  plan.popular
                    ? `border-[${RED}]/30 bg-[${RED}]/[0.04]`
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
                  style={plan.popular ? { borderColor: `${RED}40`, backgroundColor: `${RED}08` } : {}}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: RED }}>
                      แนะนำ
                    </div>
                  )}
                  <div className="text-sm font-semibold text-white/70 mb-2">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-xs text-white/30">{plan.period}</span>
                  </div>
                  <div className="space-y-2 mb-5">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-[12px] text-white/50">
                        <Check size={14} className="text-green-400 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={plan.name === "Free" ? "/login" : "/pricing"}
                    className={`block w-full py-2.5 rounded-xl text-center text-[13px] font-semibold transition-colors ${
                      plan.ctaStyle === "solid"
                        ? "text-white hover:opacity-90"
                        : "text-white/70 border border-white/[0.12] hover:bg-white/[0.06]"
                    }`}
                    style={plan.ctaStyle === "solid" ? { backgroundColor: RED } : {}}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={400}>
            <p className="text-center text-white/30 text-xs mt-6">
              ต้องการแพ็กเกจองค์กร?{" "}
              <Link href="/pricing" className="underline hover:text-white/60">ดูทั้งหมด</Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold">คำถามที่พบบ่อย</h2>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <FAQ />
          </FadeIn>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 border-t border-white/[0.04] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${RED}, transparent 60%)` }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">พร้อมจัดการค่าใช้จ่าย<br /><span style={{ color: RED }}>ได้ดีขึ้น</span>แล้วหรือยัง?</h2>
            <p className="text-white/40 text-sm mb-8">เริ่มใช้ฟรีวันนี้ ไม่ต้องใส่บัตรเครดิต ไม่ต้องลงทะเบียน</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-base shadow-xl transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: RED }}
              >
                เริ่มใช้งานฟรี <ArrowRight size={18} />
              </Link>
              <a
                href="https://line.me/R/ti/p/@iped"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-base text-white transition-colors"
                style={{ backgroundColor: GREEN }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                เพิ่มเพื่อน LINE
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-cropped.png" alt="อาซิ่ม" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-sm font-medium text-white/40">อาซิ่ม — ระบบจัดการใบเสร็จอัจฉริยะ</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <Link href="/pricing" className="hover:text-white/60 transition-colors">ราคา</Link>
            <Link href="/login" className="hover:text-white/60 transition-colors">เข้าสู่ระบบ</Link>
            <span>Powered by codelabs tech</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
