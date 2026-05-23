import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import {
  getDashboardHome,
  resolveUserRole,
  type UserRole,
} from "@/lib/auth/role";

export async function getSessionProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = resolveUserRole(profile?.role, user.user_metadata?.role);

  return {
    user,
    profile: profile as Profile | null,
    role,
  };
}

export async function requireAuth() {
  const session = await getSessionProfile();

  if (!session.user) {
    redirect("/auth/login");
  }

  return session as {
    user: NonNullable<typeof session.user>;
    profile: Profile | null;
    role: UserRole | null;
  };
}

export async function requireAuthWithRole() {
  const session = await requireAuth();

  if (!session.role) {
    redirect("/dashboard");
  }

  return {
    ...session,
    role: session.role,
  };
}

export async function requireRole(expectedRole: UserRole) {
  const session = await requireAuth();

  if (session.role && session.role !== expectedRole) {
    redirect(getDashboardHome(session.role));
  }

  return {
    ...session,
    role: (session.role ?? expectedRole) as UserRole,
  };
}
