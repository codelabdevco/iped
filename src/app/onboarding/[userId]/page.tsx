"use client";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

const GOALS = [
  { label: "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e22\u0e2d\u0e14\u0e02\u0e32\u0e22\u0e2d\u0e2d\u0e19\u0e44\u0e25\u0e19\u0e4c", icon: "\ud83d\udcca" },
  { label: "\u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e23\u0e32\u0e22\u0e23\u0e31\u0e1b-\u0e23\u0e32\u0e22\u0e08\u0e48\u0e31\u0e22", icon: "\ud83d\udcb0" },
  { label: "\u0e27\u0e32\u0e07\u0e41\u0e1c\u0e19\u0e01\u0e32\u0e23\u0e15\u0e25\u0e32\u0e14\u0e2f\u0e2d\u0e19\u0e44\u0e25\u0e19\u0e4c AI", icon: "\ud83e\udd16" },
  { label: "\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c\u0e01\u0e32\u0e23\u0e40\u0e07\u0e34\u0e19\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08", icon: "\ud83d\udcca" },
];

const GENDERS = [
  { label: "\u0e0a\u0e32\u0e24", value: "male" },
  { label: "\u0e2b\u0e0d\u0e34\u0e07", value: "female" },
  { label: "\u0e44\u0e21\u0e48\u0e23\u0e30\u0e1a\u0e38", value: "other" },
];

const P = "#FA3633";

export default function OnboardingPage() {
  const { userId } = useParams() as { userId: string };
  const [mode, setMode] = useState<"choose" | "form" | "ai">("choose");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
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
        body: JSON.stringify({ userId, name, goals, businessName: biz, monthlyBudget: budget, age, gender, occupation }),
      });
      setDone(true);
    } catch {}
  };

  const sendAI = async () => {
    if (!input.trim()) return;
    const m = input;
    setInput("");
    setMsgs((p) => [...p, { r: "user", c: m }]);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: m, history: msgs }),
      });
      const d = await res.json();
      if (d.done) setDone(true);
      if (d.reply) setMsgs((p) => [...p, { r: "ai", c: d.reply }]);
    } catch {}
    setLoading(false);
  };

  const pStyle = { backgroundColor: P };

  if (done)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">{"\ud83c\udf89"}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{"\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1b\u0e35\u0e22\u0e19\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08!"}</h2>
          <p className="text-gray-600">{"\u0e04\u0e38\u0e13\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e15\u0e48\u0e32\u0e07\u0e19\u0e35\u0e49\u0e41\u0e25\u0e30\u0e01\u0e25\u0e31\u0e1b\u0e44\u0e1b\u0e17\u0e35\u0e48 LINE \u0e44\u0e14\u0e49\u0e40\u0e25\u0e22"}</p>
        </div>
      </div>
    );

  if (mode === "choose")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">{"\u0e22\u0e34\u0e19\u0e14\u0e35\u0e15\u0e49\u0e2d\u0e19\u0e23\u0e31\u0e1b! \ud83d\udc4b"}</h1>
          <p className="text-center text-gray-500 mb-8">{"\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e34\u0e18\u0e35\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19"}</p>
          <button onClick={() => setMode("form")} className="w-full mb-4 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 text-left" style={{ borderColor: "transparent" }} onMouseEnter={(e)=>e.currentTarget.style.borderColor=P} onMouseLeave={(e)=>e.currentTarget.style.borderColor="transparent"}>
            <span className="text-2xl">{"\ud83d\udcdd"}</span>
            <span className="ml-3 font-semibold">{"\u0e01\u0e23\u0e2d\u0e01\u0e41\u0e1b\u0e1b\u0e1f\u0e2d\u0e23\u0e4c\u0e21"}</span>
          </button>
          <button onClick={() => { setMode("ai"); setMsgs([{ r: "ai", c: "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e23\u0e31\u0e1b! \u0e1c\u0e21\u0e0a\u0e37\u0e48\u0e2d iPED Assistant \u0e22\u0e34\u0e19\u0e14\u0e35\u0e17\u0e35\u0e48\u0e44\u0e14\u0e49\u0e23\u0e39\u0e49\u0e08\u0e31\u0e01\u0e04\u0e38\u0e13\u0e04\u0e23\u0e31\u0e1b \u0e0a\u0e37\u0e48\u0e2d\u0e04\u0e38\u0e13\u0e04\u0e37\u0e2d\u0e2d\u0e30\u0e44\u0e23\u0e04\u0e23\u0e31\u0e1b?" }]); }} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 text-left" style={{ borderColor: "transparent" }} onMouseEnter={(e)=>e.currentTarget.style.borderColor=P} onMouseLeave={(e)=>e.currentTarget.style.borderColor="transparent"}>
            <span className="text-2xl">{"\ud83e\udd16"}</span>
            <span className="ml-3 font-semibold">{"\u0e41\u0e0a\u0e17\u0e01\u0e31\u0e1b AI"}</span>
          </button>
        </div>
      </div>
    );

  if (mode === "ai")
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 to-white">
        <div className="p-4 text-center font-bold text-white" style={pStyle}>iPED Onboarding</div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.r === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.r === "user" ? "text-white" : "bg-white shadow"}`} style={m.r === "user" ? pStyle : {}}>
                {m.c}
              </div>
            </div>
          ))}
          {loading && <div className="text-center text-gray-400">...</div>}
        </div>
        <div className="p-4 bg-white border-t flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendAI()} placeholder={"\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21..."} className="flex-1 border rounded-full px-4 py-2" style={{ borderColor: "transparent" }} onFocus={(e) => { e.target.style.borderColor = P; }} onBlur={(e) => { e.target.style.borderColor = "transparent"; }} />
          <button onClick={sendAI} disabled={loading} className="text-white rounded-full px-6 py-2" style={pStyle}>{"\u0e2a\u0e48\u0e07"}</button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex gap-2 mb-6">
          {[1,2,3].map(s=>(
            <div key={s} className="flex-1 h-2 rounded-full" style={{ backgroundColor: step >= s ? P : "#e5e7eb" }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">{"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e31\u0e27"}</h2>
            <p className="text-sm text-gray-500 mb-5">{"\u0e1a\u0e2d\u0e01\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e25\u0e30\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e40\u0e1b\u0e37\u0e49\u0e2d\u0e07\u0e15\u0e49\u0e19"}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{"\u0e0a\u0e37\u0e48\u0e2d"}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={"\u0e0a\u0e37\u0e48\u0e2d\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13"} className="w-full border rounded-lg px-4 py-2" style={{ borderColor: "transparent" }} onFocus={(e) => { e.target.style.borderColor = P; }} onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{"\u0e2d\u0e32\u0e22\u0e38"}</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder={"\u0e2d\u0e32\u0e22\u0e38\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13"} className="w-full border rounded-lg px-4 py-2" style={{ borderColor: "transparent" }} onFocus={(e) => { e.target.style.borderColor = P; }} onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{"\u0e40\u0e1e\u0e28"}</label>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <button key={g.value} onClick={() => setGender(g.value)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${gender === g.value ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`} style={gender === g.value ? pStyle : {}}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{"\u0e2d\u0e32\u0e0a\u0e35\u0e1e"}</label>
                <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder={"\u0e2d\u0e32\u0e0a\u0e35\u0e1e\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13"} className="w-full border rounded-lg px-4 py-2" style={{ borderColor: "transparent" }} onFocus={(e) => { e.target.style.borderColor = P; }} onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
              </div>
            </div>
            <button onClick={() => name.trim() && setStep(2)} disabled={!name.trim()} className="w-full mt-5 py-3 rounded-xl text-white font-semibold" style={pStyle}>{"\u0e15\u0e48\u0e2d\u0e44\u0e1b"}</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">{"\u0e40\u0e1b\u0e49\u0e32\u0e2b\u0e21\u0e32\u0e29\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13"}</h2>
            <p className="text-sm text-gray-500 mb-5">{"\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2a\u0e34\u0e48\u0e07\u0e17\u0e35\u0e48\u0e04\u0e38\u0e13\u0e2a\u0e19\u0e43\u0e08"}</p>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button key={g.label} onClick={() => toggleGoal(g.label)} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 ${goals.includes(g.label) ? "text-white" : "bg-gray-50 hover:bg-gray-100"}`} style={goals.includes(g.label) ? pStyle : {}}>
                  <span className="text-lg">{g.icon}</span>
                  <span className="flex-1">{g.label}</span>
                  {goals.includes(g.label) && <span className="font-bold">{"\u2713"}</span>}
                </button>
              ))}
            </div>
            <button onClick={() => goals.length > 0 && setStep(3)} disabled={goals.length === 0} className="w-full mt-5 py-3 rounded-xl text-white font-semibold" style={pStyle}>{"\u0e15\u0e48\u0e2d\u0e44\u0e1b"}</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">{"\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08"}</h2>
            <p className="text-sm text-gray-500 mb-5">{"\u0e1a\u0e2d\u0e01\u0e0a\u0e37\u0e48\u0e2d\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08\u0e41\u0e25\u0e30\u0e07\u0e1b\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13 (\u0e16\u0e49\u0e32\u0e21\u0e35)"}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{"\u0e0a\u0e37\u0e48\u0e2d\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08"}</label>
                <input value={biz} onChange={(e) => setBiz(e.target.value)} placeholder={"\u0e0a\u0e37\u0e48\u0e2d\u0e23\u0e49\u0e31\u0e19\u0e2b\u0e23\u0e37\u0e2d\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08"} className="w-full border rounded-lg px-4 py-2" style={{ borderColor: "transparent" }} onFocus={(e) => { e.target.style.borderColor = P; }} onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{"\u0e07\u0e1b\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e15\u0e48\u0e2d\u0e40\u0e14\u0e37\u0e2d\u0e19 (\u0e1a\u0e32\u0e17)"}</label>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" placeholder={"\u0e07\u0e1b\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13"} className="w-full border rounded-lg px-4 py-2" style={{ borderColor: "transparent" }} onFocus={(e) => { e.target.style.borderColor = P; }} onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }} />
              </div>
            </div>
            <button onClick={submitForm} className="w-full mt-5 py-3 rounded-xl text-white font-semibold" style={pStyle}>{"\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e2a\u0e34\u0e49\u0e19"}</button>
            <button onClick={() => setStep(2)} className="w-full mt-2 text-sm text-gray-400">{"\u0e22\u0e49\u0e2d\u0e19\u0e01\u0e25\u0e31\u0e1b"}</button>
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">Powered by codelabs tech</p>
      </div>
    </div>
  );
}
