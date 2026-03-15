import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
          <div className="min-h-screen bg-[hsl(240,20%,4%)]">
            <AdminSidebar />
            <AdminHeader />
            <main className="ml-[260px] mt-14 p-6">
      {children}
            </main>
          </div>
        );
}
