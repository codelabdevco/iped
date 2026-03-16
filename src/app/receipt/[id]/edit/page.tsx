"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const CATEGORIES = [
  { id: "food", name: "/", icon: "" },
  { id: "transport", name: "/", icon: "" },
  { id: "office", name: "/", icon: "" },
  { id: "utility", name: "", icon: "" },
  { id: "medical", name: "/", icon: "" },
  { id: "material", name: "/", icon: "" },
  { id: "service", name: "", icon: "" },
  { id: "marketing", name: "/", icon: "" },
  { id: "salary", name: "/", icon: "" },
  { id: "insurance", name: "", icon: "" },
  { id: "tax", name: "/", icon: "" },
  { id: "other", name: "", icon: "" },
];

const PAYMENT_METHODS = [
  { id: "cash", name: "" },
  { id: "transfer", name: "" },
  { id: "credit", name: "" },
  { id: "debit", name: "" },
  { id: "other", name: "" },
];

export default function EditReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    merchant: "",
    amount: 0,
    date: "",
    category: "",
    categoryIcon: "",
    paymentMethod: "cash",
    vat: 0,
    wht: 0,
    note: "",
    documentType: "",
    documentNumber: "",
    items: "",
  });

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setForm({
            merchant: d.merchant || "",
            amount: d.amount || 0,
            date: d.date ? new Date(d.date).toISOString().split("T")[0] : "",
            category: d.category || "",
            categoryIcon: d.categoryIcon || "",
            paymentMethod: d.paymentMethod || "cash",
            vat: d.vat || 0,
            wht: d.wht || 0,
            note: d.note || "",
            documentType: d.documentType || "",
            documentNumber: d.documentNumber || "",
            items: d.items || "",
          });
        } else {
          setError("");
        }
      })
      .catch(() => setError(""))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "category") {
      const cat = CATEGORIES.find((c) => c.id === value);
      setForm((p) => ({ ...p, category: value, categoryIcon: cat?.icon || "" }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          vat: Number(form.vat),
          wht: Number(form.wht),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "");
      }
    } catch {
      setError("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#FFF5F5" }}>
        <p style={{ color: "#999" }}>...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#FFF5F5", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <h2 style={{ margin: "0 0 8px", color: "#333" }}>!</h2>
          <p style={{ color: "#888", margin: "0 0 24px" }}></p>
          <p style={{ color: "#aaa", fontSize: 14 }}></p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FFF5F5", padding: "16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: "#FA3633", borderRadius: "16px 16px 0 0", padding: "20px 24px", color: "#fff" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}> </h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: "0 0 16px 16px", padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {error && (
            <div style={{ background: "#FEE", border: "1px solid #FCC", borderRadius: 8, padding: "8px 12px", marginBottom: 16, color: "#C00", fontSize: 14 }}>
              {error}
            </div>
          )}

          <label style={labelStyle}> / </label>
          <input name="merchant" value={form.merchant} onChange={handleChange} style={inputStyle} required />

          <label style={labelStyle}> ()</label>
          <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} style={inputStyle} required />

          <label style={labelStyle}></label>
          <input name="date" type="date" value={form.date} onChange={handleChange} style={inputStyle} required />

          <label style={labelStyle}></label>
          <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
            <option value="">--  --</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          <label style={labelStyle}></label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} style={inputStyle}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>VAT</label>
              <input name="vat" type="number" step="0.01" value={form.vat} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>  </label>
              <input name="wht" type="number" step="0.01" value={form.wht} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}></label>
          <input name="documentType" value={form.documentType} onChange={handleChange} style={inputStyle} placeholder=" / " />

          <label style={labelStyle}></label>
          <input name="documentNumber" value={form.documentNumber} onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}></label>
          <textarea name="items" value={form.items} onChange={handleChange} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder=" ()" />

          <label style={labelStyle}></label>
          <textarea name="note" value={form.note} onChange={handleChange} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />

          <button type="submit" disabled={saving} style={{
            width: "100%", padding: "14px", marginTop: 20,
            background: saving ? "#ccc" : "#FA3633", color: "#fff",
            border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "..." : " "}
          </button>
        </form>
        <p style={{ textAlign: "center", color: "#bbb", fontSize: 12, marginTop: 16 }}>
          Powered by codelabs tech
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 14, fontWeight: 600, color: "#555",
  marginBottom: 4, marginTop: 14,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1px solid #ddd",
  borderRadius: 8, fontSize: 15, boxSizing: "border-box",
  outline: "none",
};
