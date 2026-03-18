import { connectDB } from "./mongodb";
import User from "@/models/User";

/**
 * Get Google access token for a user.
 * Refreshes if expired.
 */
export async function getGoogleToken(userId: string): Promise<string | null> {
  await connectDB();
  const user = await User.findById(userId).select("googleAccessToken googleRefreshToken").lean();
  if (!(user as any)?.googleAccessToken) return null;

  // Try existing token first
  const token = (user as any).googleAccessToken;
  const testRes = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + token);
  if (testRes.ok) return token;

  // Token expired — refresh
  const refreshToken = (user as any).googleRefreshToken;
  if (!refreshToken) return null;

  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await refreshRes.json();
  if (!data.access_token) return null;

  // Save new token
  await User.findByIdAndUpdate(userId, { googleAccessToken: data.access_token });
  return data.access_token;
}

/**
 * Find or create iPED folder in Google Drive.
 */
export async function getOrCreateFolder(token: string): Promise<string> {
  // Search for existing folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='iPED' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files?.length > 0) return searchData.files[0].id;

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "iPED", mimeType: "application/vnd.google-apps.folder" }),
  });
  const folder = await createRes.json();
  return folder.id;
}

/**
 * Upload a file to Google Drive iPED folder.
 */
export async function uploadToDrive(token: string, fileName: string, mimeType: string, base64Data: string): Promise<{ id: string; webViewLink: string } | null> {
  try {
    const folderId = await getOrCreateFolder(token);

    // Convert base64 to binary
    const dataUrl = base64Data.startsWith("data:") ? base64Data : `data:${mimeType};base64,${base64Data}`;
    const base64Only = dataUrl.split(",")[1];
    const binaryStr = Buffer.from(base64Only, "base64");

    // Multipart upload
    const boundary = "iPED_boundary_" + Date.now();
    const metadata = JSON.stringify({
      name: fileName,
      parents: [folderId],
    });

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`),
      Buffer.from(base64Only),
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    const result = await uploadRes.json();
    if (result.id) return { id: result.id, webViewLink: result.webViewLink || "" };
    return null;
  } catch (e) {
    console.error("Drive upload error:", e);
    return null;
  }
}

/**
 * List files in iPED folder on Google Drive.
 */
export async function listDriveFiles(token: string): Promise<any[]> {
  const folderId = await getOrCreateFolder(token);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink)&orderBy=createdTime desc&pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.files || [];
}
