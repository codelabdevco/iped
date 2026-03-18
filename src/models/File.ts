import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  name: string;
  type: string; // mime type
  size: number; // bytes
  data: string; // base64
  category?: string;
  note?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: String, required: true },
    category: String,
    note: String,
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

FileSchema.index({ name: "text", note: "text" });

export default mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
