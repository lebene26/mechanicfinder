import { DashboardLayout } from "@/components/dashboard-layout";
import { ProfileForm } from "@/components/profile-form";
import { requireRole } from "@/lib/auth/session";

export default async function ProfilePage() {
  const { user, profile } = await requireRole("client");

  return (
    <DashboardLayout userRole="client" userName={profile?.full_name || undefined}>
      <div className="px-4 py-6 md:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings
            </p>
          </div>
          <ProfileForm profile={profile} userId={user.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
