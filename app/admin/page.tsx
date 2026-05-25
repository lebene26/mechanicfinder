import { AdminLayout } from "@/components/admin-layout";
import { AdminDashboardContent } from "@/components/admin-dashboard";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, profile } = await requireAdmin();

  // Use the service-role client so we can read every profile regardless of RLS.
  const admin = createAdminClient();

  const { data: usersData } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (usersData as Profile[] | null) ?? [];

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === "client").length,
    mechanics: users.filter((u) => u.role === "mechanic").length,
    admins: users.filter((u) => u.role === "admin").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    newThisWeek: users.filter(
      (u) => new Date(u.created_at).getTime() >= oneWeekAgo
    ).length,
  };

  return (
    <AdminLayout
      userName={profile?.full_name || undefined}
      userEmail={profile?.email || user.email || undefined}
    >
      <AdminDashboardContent
        currentUserId={user.id}
        users={users}
        stats={stats}
      />
    </AdminLayout>
  );
}
