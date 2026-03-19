// Storage abstraction layer — currently uses MongoDB, can be swapped to S3
// This provides a clean interface for future S3 migration

export interface StorageResult {
  key: string;
  url: string;
  size: number;
}

/**
 * Store a file. Currently saves as base64 in MongoDB.
 * Future: upload to S3 and return signed URL.
 */
export async function storeFile(data: string | Buffer, options: {
  filename: string;
  mimeType: string;
  userId: string;
}): Promise<StorageResult> {
  // Current implementation: base64 in DB (will be replaced with S3)
  const base64 = typeof data === "string" ? data : data.toString("base64");
  const size = Buffer.byteLength(base64, "base64");
  const key = `${options.userId}/${Date.now()}-${options.filename}`;

  return {
    key,
    url: `data:${options.mimeType};base64,${base64}`,
    size,
  };
}

/**
 * Get a file URL. Currently returns data URL.
 * Future: return S3 signed URL.
 */
export function getFileUrl(key: string, dataUrl?: string): string {
  // Current: return data URL directly
  // Future: generate S3 signed URL from key
  return dataUrl || "";
}

/**
 * Delete a file.
 * Future: delete from S3.
 */
export async function deleteFile(key: string): Promise<void> {
  // Current: no-op (data stored in MongoDB document)
  // Future: S3 deleteObject
}

// S3 migration plan:
// 1. Install @aws-sdk/client-s3
// 2. Replace storeFile() to upload to S3
// 3. Replace getFileUrl() to generate presigned URLs
// 4. Run migration script: read all base64 from DB → upload to S3 → update URLs
// 5. Remove base64 data from MongoDB documents
