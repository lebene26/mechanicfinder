import { DashboardLayout } from "@/components/dashboard-layout";
import { RequestsList } from "@/components/requests-list";
import { requireAuthWithRole } from "@/lib/auth/session";
import type { MechanicProfile, Profile, ServiceRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function RequestsPage() {
  const { user, profile, role } = await requireAuthWithRole();
  const supabase = await createClient();
  const isClient = role === "client";

  let requests: (ServiceRequest & {
    mechanic_profiles?: MechanicProfile & { profiles: Profile };
    profiles?: Profile;
  })[] = [];

  let reviewedRequestIds: string[] = [];

  if (isClient) {
    const [{ data }, { data: reviews }] = await Promise.all([
      supabase
        .from("service_requests")
        .select("*, mechanic_profiles(*, profiles:user_id(*))")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("reviews").select("request_id").eq("client_id", user.id),
    ]);
    requests = data || [];
    reviewedRequestIds = reviews?.map((r) => r.request_id) ?? [];
  } else if (role === "mechanic") {
    const { data: mechanicProfile } = await supabase
      .from("mechanic_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (mechanicProfile) {
      const { data } = await supabase
        .from("service_requests")
        .select("*, profiles(*)")
        .eq("mechanic_id", mechanicProfile.id)
        .order("created_at", { ascending: false });
      requests = data || [];
    }
  }

  return (
    <DashboardLayout
      userRole={role}
      userName={profile?.full_name || undefined}
    >
      <div className="px-4 py-6 md:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isClient ? "My Requests" : "Service Requests"}
          </h1>
          <p className="text-muted-foreground">
            {isClient
              ? "View and manage your service requests"
              : "View and manage incoming service requests"}
          </p>
        </div>
        <RequestsList
          requests={requests}
          isClient={isClient}
          reviewedRequestIds={reviewedRequestIds}
        />
      </div>
    </DashboardLayout>
  );
}
