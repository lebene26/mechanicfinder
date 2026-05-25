"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionResult = { success: true } | { error: string };

export async function suspendUser(userId: string): Promise<AdminActionResult> {
  const { user } = await requireAdmin();

  if (user.id === userId) {
    return { error: "You can't suspend your own account." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function unsuspendUser(
  userId: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<AdminActionResult> {
  const { user } = await requireAdmin();

  if (user.id === userId) {
    return { error: "You can't delete your own account." };
  }

  const admin = createAdminClient();

  // Deleting the auth user cascades to public.profiles (FK on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
