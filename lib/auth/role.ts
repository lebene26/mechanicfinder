export type UserRole = "client" | "mechanic" | "admin";

export function isUserRole(value: unknown): value is UserRole {
  return value === "client" || value === "mechanic" || value === "admin";
}

export function resolveUserRole(
  profileRole: unknown,
  metadataRole?: unknown
): UserRole | null {
  if (isUserRole(profileRole)) return profileRole;
  if (isUserRole(metadataRole)) return metadataRole;
  return null;
}

export function getDashboardHome(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "mechanic") return "/dashboard/mechanic";
  return "/dashboard/client";
}

export const CLIENT_ONLY_PREFIXES = ["/dashboard/client"] as const;

export const MECHANIC_ONLY_PREFIXES = ["/dashboard/mechanic"] as const;

export const ADMIN_ONLY_PREFIXES = ["/admin"] as const;

export function isClientOnlyPath(pathname: string): boolean {
  return CLIENT_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isMechanicOnlyPath(pathname: string): boolean {
  return MECHANIC_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
