import { Suspense } from "react";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import NotificationsClient, { NotificationItem } from "./NotificationsClient";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} เดือนที่แล้ว`;
  return `${Math.floor(diffDay / 365)} ปีที่แล้ว`;
}

async function NotificationsData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iped-token")?.value;
  if (!token) return <NotificationsClient notifications={[]} />;

  const decoded = await verifyToken(token);
  if (!decoded) return <NotificationsClient notifications={[]} />;

  await connectDB();

  const raw = await Notification.find({ userId: decoded.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const notifications: NotificationItem[] = raw.map((n: any) => ({
    _id: String(n._id),
    type: n.type,
    title: n.title,
    description: n.description,
    timeAgo: formatTimeAgo(new Date(n.createdAt)),
    read: n.read ?? false,
  }));

  return <NotificationsClient notifications={notifications} />;
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <NotificationsData />
    </Suspense>
  );
}
