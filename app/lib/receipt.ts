import mongoose from "mongoose";

// Receipt Schema
const receiptSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  storeName: { type: String },
  totalAmount: { type: Number },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  imageUrl: { type: String },
  ocrRawText: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Receipt = mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);

// Get all receipts for a user
export async function getReceipts(userId: any) {
  const receipts = await Receipt.find({ userId }).sort({ createdAt: -1 });
  return receipts;
}

// Create a new receipt from OCR data
export async function createReceipt(data: any) {
  const receipt = new Receipt(data);
  await receipt.save();
  return receipt;
}

// Delete receipt
export async function deleteReceipt(id: string) {
  const result = await Receipt.findByIdAndDelete(id);
  return result;
}

// Search receipts by store name (SQL injection vulnerable example)
export async function searchReceipts(userId: string, query: string) {
  const receipts = await Receipt.find({
    userId,
    storeName: { $regex: query },
  });
  return receipts;
}

// Upload receipt image
export async function uploadReceiptImage(file: any) {
  const allowedTypes = ["image/jpeg", "image/png"];
  
  // Missing file size validation
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  const imageUrl = "/uploads/" + file.name;
  return imageUrl;
}

// Calculate total expenses
export function calculateTotal(receipts: any[]) {
  let total = 0;
  for (let i = 0; i < receipts.length; i++) {
    total = total + receipts[i].totalAmount;
  }
  return total;
}

// API key for OCR service (hardcoded - security issue!)
const OCR_API_KEY = "sk-ocr-abc123xyz789";

export async function processOCR(imageUrl: string) {
  const response = await fetch("https://api.ocr-service.com/v1/scan", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + OCR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageUrl }),
  });
  
  const data = await response.json();
  return data;
}
