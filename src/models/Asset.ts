import mongoose, { Schema, Document } from "mongoose";

export interface IAssetHistory {
  action: "register" | "borrow" | "return" | "transfer" | "maintenance" | "retire" | "condition-change";
  date: Date;
  borrower?: string;
  borrowerName?: string;
  department?: string;
  purpose?: string;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  conditionBefore?: string;
  conditionAfter?: string;
  approvedBy?: string;
  note?: string;
}

export interface IAssetFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64
  uploadedAt: Date;
}

export interface IAsset extends Document {
  userId: string;
  orgId?: string;

  // Identity
  assetCode: string;
  name: string;
  description?: string;
  category: string;
  subCategory?: string;

  // Specifications
  brand?: string;
  model?: string;
  serialNumber?: string;
  color?: string;
  specifications?: string;

  // Purchase
  purchaseDate?: Date;
  purchasePrice: number;
  vendor?: string;
  invoiceNumber?: string;
  warrantyExpiry?: Date;

  // Depreciation
  usefulLifeYears: number;
  salvageValue: number;
  currentValue: number;
  depreciationMethod: "straight-line" | "declining-balance" | "none";

  // Location
  location?: string;
  department?: string;
  building?: string;
  floor?: string;
  room?: string;

  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedDate?: Date;

  // Status
  status: "available" | "in-use" | "borrowed" | "maintenance" | "retired" | "lost" | "disposed";
  condition: "new" | "excellent" | "good" | "fair" | "poor" | "broken";

  // Borrow tracking
  currentBorrower?: string;
  currentBorrowerName?: string;
  borrowDate?: Date;
  expectedReturnDate?: Date;
  borrowPurpose?: string;

  // History
  history: IAssetHistory[];

  // Files
  files: IAssetFile[];

  // Meta
  imageUrl?: string;
  tags?: string[];
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetFileSchema = new Schema({
  name: String,
  type: String,
  size: Number,
  data: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const AssetHistorySchema = new Schema({
  action: { type: String, enum: ["register", "borrow", "return", "transfer", "maintenance", "retire", "condition-change"], required: true },
  date: { type: Date, default: Date.now },
  borrower: String,
  borrowerName: String,
  department: String,
  purpose: String,
  expectedReturnDate: Date,
  actualReturnDate: Date,
  conditionBefore: String,
  conditionAfter: String,
  approvedBy: String,
  note: String,
}, { _id: true });

const AssetSchema = new Schema<IAsset>(
  {
    userId: { type: String, required: true },
    orgId: String,

    assetCode: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    subCategory: String,

    brand: String,
    model: String,
    serialNumber: String,
    color: String,
    specifications: String,

    purchaseDate: Date,
    purchasePrice: { type: Number, default: 0 },
    vendor: String,
    invoiceNumber: String,
    warrantyExpiry: Date,

    usefulLifeYears: { type: Number, default: 5 },
    salvageValue: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    depreciationMethod: { type: String, enum: ["straight-line", "declining-balance", "none"], default: "straight-line" },

    location: String,
    department: String,
    building: String,
    floor: String,
    room: String,

    assignedTo: String,
    assignedToName: String,
    assignedDate: Date,

    status: { type: String, enum: ["available", "in-use", "borrowed", "maintenance", "retired", "lost", "disposed"], default: "available" },
    condition: { type: String, enum: ["new", "excellent", "good", "fair", "poor", "broken"], default: "new" },

    currentBorrower: String,
    currentBorrowerName: String,
    borrowDate: Date,
    expectedReturnDate: Date,
    borrowPurpose: String,

    history: [AssetHistorySchema],
    files: [AssetFileSchema],

    imageUrl: String,
    tags: [String],
    note: String,
  },
  { timestamps: true }
);

AssetSchema.index({ userId: 1, orgId: 1 });
AssetSchema.index({ assetCode: 1 });
AssetSchema.index({ status: 1 });
AssetSchema.index({ category: 1 });

export default mongoose.models.Asset || mongoose.model<IAsset>("Asset", AssetSchema);
