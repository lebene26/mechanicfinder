import { redirect } from "next/navigation";
import { getDashboardHome } from "@/lib/auth/role";
import { getSessionProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { user, role } = await getSessionProfile();

  if (!user) {
    redirect("/auth/login");
  }

  if (role) {
    redirect(getDashboardHome(role));
  }

  redirect("/dashboard/client");
}
