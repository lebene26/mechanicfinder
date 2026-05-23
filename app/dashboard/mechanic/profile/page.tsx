import { DashboardLayout } from "@/components/dashboard-layout";
import { MechanicProfileForm } from "@/components/mechanic-profile-form";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function MechanicProfilePage() {
  const { user, profile } = await requireRole("mechanic");
  const supabase = await createClient();

  const { data: mechanicProfile } = await supabase
    .from("mechanic_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <DashboardLayout userRole="mechanic" userName={profile?.full_name || undefined}>
      <div className="px-4 py-6 md:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {mechanicProfile ? "Edit Profile" : "Set Up Your Profile"}
            </h1>
            <p className="text-muted-foreground">
              {mechanicProfile
                ? "Update your workshop details and services"
                : "Complete your profile to start receiving requests"}
            </p>
          </div>
          <MechanicProfileForm
            userId={user.id}
            existingProfile={mechanicProfile}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
