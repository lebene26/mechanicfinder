import { DashboardLayout } from "@/components/dashboard-layout";
import { MechanicSearch } from "@/components/mechanic-search";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDashboardPage() {
  const { user, profile } = await requireRole("client");
  const supabase = await createClient();

  const { data: mechanics } = await supabase
    .from("mechanic_profiles")
    .select("*, profiles(*)")
    .order("rating", { ascending: false });

  return (
    <DashboardLayout userRole="client" userName={profile?.full_name || undefined}>
      <div className="px-4 py-6 md:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Find a Mechanic</h1>
          <p className="text-muted-foreground">
            Search for trusted mechanics in your area
          </p>
        </div>
        <MechanicSearch mechanics={mechanics || []} userId={user.id} />
      </div>
    </DashboardLayout>
  );
}
