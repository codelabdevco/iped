"use client";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

const GOALS = [
  { label: "\u0e15\u0e34\u0e14\u0e15\u0e32\u0e21\u0e23\u0e32\u0e22\u0e08\u0e48\u0e32\u0e22", icon: "\ud83d\udcb8" },
  { label: "\u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08", icon: "\ud83c\udfe2" },
  { label: "\u0e17\u0e35\u0e48\u0e1b\u0e23\u0e36\u0e01\u0e29\u0e32\u0e01\u0e32\u0e23\u0e40\u0e07\u0e34\u0e19 AI", icon: "\ud83e\udd16" },
  { label: "\u0e27\u0e32\u0e07\u0e41\u0e1c\u0e19\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13", icon: "\ud83d\udcca" },
];

export default function OnboardingPage() {
  const { userId } = useParams() as { userId: string };
  const [mode, setMode] = useState<"choose" | "form" | "ai">("choose");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [biz, setBiz] = useState("");
  const [budget, setBudget] = useState("");
  const [msgs, setMsgs] = useState<{ r: string; c: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [msgs]);

  const toggleGoal = (v: string) =>
    setGoals(goals.includes(v) ? goals.filter((x) => x !== v) : [...goals, v]);

  const submitForm = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          goals,
          businessName: biz || undefined,
          monthlyBudget: budget ? Number(budget) : undefined,
        }),
      });
      setDone(true);
    } catch (e) {
      alert("\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14 \u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07");
    }
  };

  const sendAI = async () => {
    if (!input.trim() || loading) return;
    const newMsgs = [...msgs, { r: "user", c: input }];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: newMsgs.map((m) => ({ role: m.r, content: m.c })),
        }),
      });
      const data = await res.json();
      setMsgs([...newMsgs, { r: "assistant", c: data.message }]);
      if (data.complete) setTimeout(() => setDone(true), 2000);
    } catch {
      setMsgs([
        ...newMsgs,
        { r: "assistant", c: "\u0e02\u0e2d\u0e42\u0e17\u0e29\u0e04\u0e23\u0e31\u0e1a \u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14 \u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07" },
      ]);
    }
    setLoading(false);
  };

  const cn = (...c: string[]) => c.join(" ");
  const card = "bg-white rounded-2xl shadow-lg max-w-md w-full mx-auto p-6";
  const btnP =
    "w-full py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition disabled:opacity-40";
  const btnS =
    "w-full py-3 rounded-xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition";
  const inputC =
    "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition text-sm";
  const fontThai = { fontFamily: "'Noto Sans Thai', sans-serif" };

  // Success
  if (done)
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4"
        style={fontThai}
      >
        <div className={cn(card, "text-center")}>
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#x2705;</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {"\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08!"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e16\u0e39\u0e01\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22\u0e41\u0e25\u0e49\u0e27"}
          </p>
          <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700">
            {"\u0e01\u0e25\u0e31\u0e1a\u0e44\u0e1b\u0e17\u0e35\u0e48 LINE \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e40\u0e23\u0e34\u0e48\u0e21\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19 iped"}
          </div>
          <p className="text-xs text-gray-400 mt-6">Powered by codelabs tech</p>
        </div>
      </div>
    );

  // Choose mode
  if (mode === "choose")
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4"
        style={fontThai}
      >
        <div className={card}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              i
            </div>
            <span className="font-bold text-gray-700">iped</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            {"\u0e22\u0e34\u0e19\u0e14\u0e35\u0e15\u0e49\u0e2d\u0e19\u0e23\u0e31\u0e1a! \ud83d\udc4b"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {"\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e34\u0e18\u0e35\u0e17\u0e35\u0e48\u0e04\u0e38\u0e13\u0e2a\u0e30\u0e14\u0e27\u0e01\u0e43\u0e19\u0e01\u0e32\u0e23\u0e01\u0e23\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25"}
          </p>
          <div className="space-y-3">
            <button onClick={() => setMode("form")} className={btnP}>
              {"\ud83d\udcdd \u0e01\u0e23\u0e2d\u0e01\u0e1f\u0e2d\u0e23\u0e4c\u0e21 (3 \u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19)"}
            </button>
            <button
              onClick={() => {
                setMode("ai");
                setMsgs([
                  {
                    r: "assistant",
                    c: "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e23\u0e31\u0e1a! \u0e1c\u0e21 AI \u0e02\u0e2d\u0e07 iped \ud83d\udc4b\n\n\u0e1c\u0e21\u0e08\u0e30\u0e0a\u0e48\u0e27\u0e22\u0e40\u0e01\u0e47\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e1c\u0e48\u0e32\u0e19\u0e01\u0e32\u0e23\u0e1e\u0e39\u0e14\u0e04\u0e38\u0e22\n\n\u0e40\u0e23\u0e34\u0e48\u0e21\u0e08\u0e32\u0e01\u0e1a\u0e2d\u0e01\u0e0a\u0e37\u0e48\u0e2d\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e43\u0e2b\u0e49\u0e1c\u0e21\u0e17\u0e23\u0e32\u0e1a\u0e44\u0e14\u0e49\u0e44\u0e2b\u0e21\u0e04\u0e23\u0e31\u0e1a?",
                  },
                ]);
              }}
              className={btnS}
            >
              {"\ud83d\udcac \u0e04\u0e38\u0e22\u0e01\u0e31\u0e1a AI \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e01\u0e23\u0e2d\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25"}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">
            Powered by codelabs tech
          </p>
        </div>
      </div>
    );

  // AI Chat mode
  if (mode === "ai")
    return (
      <div
        className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto"
        style={fontThai}
      >
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMode("choose")}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            {"\u2190"}
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
            i
          </div>
          <div>
            <p className="font-bold text-gray-700 text-sm">iped AI</p>
            <p className="text-xs text-emerald-500">
              {"\u0e2d\u0e2d\u0e19\u0e44\u0e25\u0e19\u0e4c"}
            </p>
          </div>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.r === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={cn(
                  "max-w-[80%] px-4 py-3 text-sm whitespace-pre-wrap",
                  m.r === "user"
                    ? "bg-emerald-500 text-white rounded-2xl rounded-br-md"
                    : "bg-white shadow-sm text-gray-700 rounded-2xl rounded-bl-md"
                )}
              >
                {m.c}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-md text-sm text-gray-400">
                <span className="animate-pulse">
                  {"\u0e01\u0e33\u0e25\u0e31\u0e07\u0e1e\u0e34\u0e21\u0e1e\u0e4c..."}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendAI()}
            placeholder={"\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21..."}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm outline-none focus:border-emerald-400"
          />
          <button
            onClick={sendAI}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-40 transition"
          >
            {"\u27a4"}
          </button>
        </div>
      </div>
    );

  // Form mode - 3 steps
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4"
      style={fontThai}
    >
      <div className={card}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : setMode("choose"))}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            {"\u2190"}
          </button>
          <div className="flex-1 flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  i <= step ? "bg-emerald-500" : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">{step}/3</span>
        </div>

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {"\u0e0a\u0e37\u0e48\u0e2d\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {"\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e0a\u0e37\u0e48\u0e2d\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e41\u0e2a\u0e14\u0e07\u0e43\u0e19\u0e23\u0e30\u0e1a\u0e1a"}
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={"\u0e0a\u0e37\u0e48\u0e2d - \u0e19\u0e32\u0e21\u0e2a\u0e01\u0e38\u0e25"}
              className={inputC}
              autoFocus
            />
            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className={cn(btnP, "mt-5")}
            >
              {"\u0e16\u0e31\u0e14\u0e44\u0e1b"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {"\u0e40\u0e1b\u0e49\u0e32\u0e2b\u0e21\u0e32\u0e22\u0e01\u0e32\u0e23\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {"\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e14\u0e49\u0e21\u0e32\u0e01\u0e01\u0e27\u0e48\u0e32 1 \u0e02\u0e49\u0e2d"}
            </p>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.label}
                  onClick={() => toggleGoal(g.label)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-xl border-2 transition text-sm flex items-center gap-3",
                    goals.includes(g.label)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <span className="text-lg">{g.icon}</span>
                  <span className="flex-1">{g.label}</span>
                  {goals.includes(g.label) && (
                    <span className="text-emerald-500 font-bold">&#x2713;</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => goals.length > 0 && setStep(3)}
              disabled={goals.length === 0}
              className={cn(btnP, "mt-5")}
            >
              {"\u0e16\u0e31\u0e14\u0e44\u0e1b"}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e40\u0e15\u0e34\u0e21"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {"\u0e44\u0e21\u0e48\u0e08\u0e33\u0e40\u0e1b\u0e47\u0e19\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e23\u0e2d\u0e01 \u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e02\u0e49\u0e32\u0e21\u0e44\u0e14\u0e49"}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {"\u0e0a\u0e37\u0e48\u0e2d\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08"}
                </label>
                <input
                  value={biz}
                  onChange={(e) => setBiz(e.target.value)}
                  placeholder={"\u0e44\u0e21\u0e48\u0e1a\u0e31\u0e07\u0e04\u0e31\u0e1a"}
                  className={inputC}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {"\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e23\u0e32\u0e22\u0e40\u0e14\u0e37\u0e2d\u0e19 (\u0e1a\u0e32\u0e17)"}
                </label>
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  type="number"
                  placeholder={"\u0e44\u0e21\u0e48\u0e1a\u0e31\u0e07\u0e04\u0e31\u0e1a"}
                  className={inputC}
                />
              </div>
            </div>
            <button onClick={submitForm} className={cn(btnP, "mt-5")}>
              {"\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25"}
            </button>
            <button onClick={submitForm} className={cn(btnS, "mt-2 text-sm")}>
              {"\u0e02\u0e49\u0e32\u0e21\u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19\u0e19\u0e35\u0e49"}
            </button>
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Powered by codelabs tech
        </p>
      </div>
    </div>
  );
}
