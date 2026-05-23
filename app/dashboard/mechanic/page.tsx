import { DashboardLayout } from "@/components/dashboard-layout";
import { MechanicDashboardContent } from "@/components/mechanic-dashboard";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function MechanicDashboardPage() {
  const { user, profile } = await requireRole("mechanic");
  const supabase = await createClient();

  const { data: mechanicProfile } = await supabase
    .from("mechanic_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  let requests: (import("@/lib/types").ServiceRequest & {
    profiles: import("@/lib/types").Profile;
  })[] = [];

  if (mechanicProfile) {
    const { data } = await supabase
      .from("service_requests")
      .select("*, profiles(*)")
      .eq("mechanic_id", mechanicProfile.id)
      .order("created_at", { ascending: false });
    requests = data || [];
  }

  return (
    <DashboardLayout userRole="mechanic" userName={profile?.full_name || undefined}>
      <div className="px-4 py-6 md:px-6 lg:px-8 pb-20 md:pb-6">
        <MechanicDashboardContent
          userId={user.id}
          profile={profile}
          mechanicProfile={mechanicProfile}
          requests={requests || []}
        />
      </div>
    </DashboardLayout>
  );
}
