import Anthropic from "@anthropic-ai/sdk";
import { suggestCategory } from "./categories";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

export interface OCRResult {
  merchant: string;
  merchantTaxId?: string;
  merchantBranch?: string;
  merchantAddress?: string;
  documentNumber?: string;
  date: string;
  dueDate?: string;
  amount: number;
  subtotal?: number;
  discount?: number;
  vat?: number;
  vatRate?: number;
  wht?: number;
  whtRate?: number;
  type: "receipt" | "invoice" | "billing" | "debit_note" | "credit_note" | "tax_invoice" | "quotation";
  paymentMethod?: string;
  category: string;
  categoryIcon: string;
  lineItems?: { description: string; quantity: number; unitPrice: number; amount: number }[];
  currency: string;
  ocrConfidence: number;
  ocrRawText: string;
}

export async function processOCR(imageBase64: string, mimeType: string): Promise<OCRResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return simulateOCR();
  }

  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Analyze this Thai receipt/invoice/billing document. Extract ALL information and return ONLY valid JSON (no markdown, no code blocks):
{
  "merchant": "store/company name",
  "merchantTaxId": "tax ID if visible",
  "merchantBranch": "branch name/number",
  "merchantAddress": "address if visible",
  "documentNumber": "receipt/invoice number",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD if applicable",
  "amount": total_amount_number,
  "subtotal": subtotal_before_vat,
  "discount": discount_amount,
  "vat": vat_amount,
  "vatRate": vat_percentage,
  "wht": withholding_tax_amount,
  "whtRate": wht_percentage,
  "type": "receipt|invoice|billing|debit_note|credit_note|tax_invoice|quotation",
  "paymentMethod": "cash|transfer|credit|debit|cheque|ewallet",
  "currency": "THB",
  "lineItems": [{"description":"item","quantity":1,"unitPrice":100,"amount":100}],
  "confidence": 0-100
}
Use null for fields not found. Amount should be the final total. Date in YYYY-MM-DD format.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    const category = suggestCategory(parsed.merchant || "");

    return {
      merchant: parsed.merchant || "\u0e44\u0e21\u0e48\u0e17\u0e23\u0e32\u0e1a\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32",
      merchantTaxId: parsed.merchantTaxId || undefined,
      merchantBranch: parsed.merchantBranch || undefined,
      merchantAddress: parsed.merchantAddress || undefined,
      documentNumber: parsed.documentNumber || undefined,
      date: parsed.date || new Date().toISOString().split("T")[0],
      dueDate: parsed.dueDate || undefined,
      amount: parsed.amount || 0,
      subtotal: parsed.subtotal || undefined,
      discount: parsed.discount || undefined,
      vat: parsed.vat || undefined,
      vatRate: parsed.vatRate || 7,
      wht: parsed.wht || undefined,
      whtRate: parsed.whtRate || undefined,
      type: parsed.type || "receipt",
      paymentMethod: parsed.paymentMethod || undefined,
      category: category.id,
      categoryIcon: category.icon,
      lineItems: parsed.lineItems || undefined,
      currency: parsed.currency || "THB",
      ocrConfidence: parsed.confidence || 90,
      ocrRawText: text,
    };
  } catch {
    const category = suggestCategory(text);
    return {
      merchant: "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19\u0e44\u0e14\u0e49",
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      type: "receipt",
      category: category.id,
      categoryIcon: category.icon,
      currency: "THB",
      ocrConfidence: 30,
      ocrRawText: text,
    };
  }
}

// Fallback demo OCR
function simulateOCR(): OCRResult {
  const merchants = [
    { name: "7-Eleven \u0e2a\u0e32\u0e02\u0e32\u0e2a\u0e22\u0e32\u0e21\u0e1e\u0e32\u0e23\u0e32\u0e01\u0e2d\u0e19", amount: 385, cat: "food" },
    { name: "Makro \u0e2a\u0e32\u0e02\u0e32\u0e23\u0e31\u0e07\u0e2a\u0e34\u0e15", amount: 12500, cat: "material" },
    { name: "Shell \u0e2a\u0e32\u0e02\u0e32\u0e27\u0e34\u0e20\u0e32\u0e27\u0e14\u0e35", amount: 1500, cat: "transport" },
    { name: "True Corporation", amount: 1200, cat: "service" },
    { name: "Cafe Amazon \u0e2a\u0e32\u0e02\u0e32\u0e2d\u0e42\u0e28\u0e01", amount: 165, cat: "food" },
  ];
  const m = merchants[Math.floor(Math.random() * merchants.length)];
  const category = suggestCategory(m.name);

  return {
    merchant: m.name,
    date: new Date().toISOString().split("T")[0],
    amount: m.amount,
    vat: Math.round(m.amount * 0.07),
    vatRate: 7,
    type: "receipt",
    category: category.id,
    categoryIcon: category.icon,
    currency: "THB",
    ocrConfidence: Math.floor(Math.random() * 15) + 85,
    ocrRawText: `[DEMO] ${m.name} - \u0e3f${m.amount}`,
  };
}
