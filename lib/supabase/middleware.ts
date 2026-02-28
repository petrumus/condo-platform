import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/types/database"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not add logic between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  function redirectTo(path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ""
    return NextResponse.redirect(url)
  }

  // ── Unauthenticated guards ───────────────────────────────────────────────
  const isProtected =
    pathname.startsWith("/app/") || pathname.startsWith("/super-admin/")

  if (isProtected && !user) {
    return redirectTo("/")
  }

  // ── Super-admin guard ────────────────────────────────────────────────────
  if (pathname.startsWith("/super-admin/") && user) {
    const isSuperAdmin =
      user.app_metadata?.role === "super-admin" ||
      user.app_metadata?.is_super_admin === true

    if (!isSuperAdmin) {
      return redirectTo("/")
    }
  }

  // ── Post-login redirect for authenticated users hitting "/" ──────────────
  if (pathname === "/" && user) {
    // Check if user has any memberships
    const { data: memberships } = await supabase
      .from("condominium_members")
      .select("*, condominiums ( slug )")
      .eq("user_id", user.id)
      .limit(1)

    if (memberships && memberships.length > 0) {
      const membership = memberships[0] as {
        condominiums: { slug: string } | null
      }
      if (membership.condominiums?.slug) {
        return redirectTo(`/app/${membership.condominiums.slug}/dashboard`)
      }
    }

    // Authenticated but no condominium — send to pending
    // (skip redirect loop: /pending itself must not redirect)
    if (pathname !== "/pending") {
      return redirectTo("/pending")
    }
  }

  // ── Guard /pending for unauthenticated users ─────────────────────────────
  if (pathname === "/pending" && !user) {
    return redirectTo("/")
  }

  return supabaseResponse
}
