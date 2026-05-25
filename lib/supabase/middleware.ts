import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getDashboardHome,
  isAdminOnlyPath,
  isClientOnlyPath,
  isMechanicOnlyPath,
  resolveUserRole,
} from "@/lib/auth/role";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ["/dashboard", "/chat", "/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const pathname = request.nextUrl.pathname;

  let role: ReturnType<typeof resolveUserRole> = null;
  let status: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    role = resolveUserRole(profile?.role, user.user_metadata?.role);
    status = (profile?.status as string | undefined) ?? "active";
  }

  // Suspended users are signed out and bounced to the login page with a notice.
  if (user && status === "suspended") {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("suspended", "1");
    return NextResponse.redirect(url);
  }

  if (user && role) {
    if (role === "admin") {
      if (
        pathname === "/dashboard" ||
        isClientOnlyPath(pathname) ||
        isMechanicOnlyPath(pathname)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    } else {
      if (isAdminOnlyPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = getDashboardHome(role);
        return NextResponse.redirect(url);
      }

      if (role === "mechanic" && isClientOnlyPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = getDashboardHome("mechanic");
        return NextResponse.redirect(url);
      }

      if (role === "client" && isMechanicOnlyPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = getDashboardHome("client");
        return NextResponse.redirect(url);
      }

      if (role === "mechanic" && pathname === "/dashboard/profile") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/mechanic/profile";
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect logged in users away from auth pages
  const authPaths = ["/auth/login", "/auth/signup"];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = role ? getDashboardHome(role) : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
