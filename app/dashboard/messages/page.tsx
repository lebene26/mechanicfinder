import { DashboardLayout } from "@/components/dashboard-layout";
import { MessagesList } from "@/components/messages-list";
import { requireAuthWithRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const { user, profile, role } = await requireAuthWithRole();
  const supabase = await createClient();
  const isClient = role === "client";

  let conversations: unknown[] = [];

  if (isClient) {
    const { data } = await supabase
      .from("service_requests")
      .select(
        `
        *,
        mechanic_profiles(workshop_name, profiles:user_id(*)),
        messages(*)
      `
      )
      .eq("client_id", user.id)
      .in("status", ["accepted", "in_progress"])
      .order("updated_at", { ascending: false });

    conversations = (data || []).filter(
      (r: { messages?: unknown[] }) => (r.messages?.length ?? 0) > 0
    );
  } else if (role === "mechanic") {
    const { data: mechanicProfile } = await supabase
      .from("mechanic_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (mechanicProfile) {
      const { data } = await supabase
        .from("service_requests")
        .select(
          `
          *,
          profiles(*),
          messages(*)
        `
        )
        .eq("mechanic_id", mechanicProfile.id)
        .in("status", ["accepted", "in_progress"])
        .order("updated_at", { ascending: false });

      conversations = (data || []).filter(
        (r: { messages?: unknown[] }) => (r.messages?.length ?? 0) > 0
      );
    }
  }

  return (
    <DashboardLayout
      userRole={role}
      userName={profile?.full_name || undefined}
    >
      <div className="px-4 py-6 md:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            {isClient
              ? "Chat with your mechanic while your request is in progress"
              : "Your active conversations"}
          </p>
        </div>
        <MessagesList conversations={conversations as never} isClient={isClient} />
      </div>
    </DashboardLayout>
  );
}
