import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Separator } from "@/components/ui/separator"

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export default async function SuperAdminLayout({
  children,
}: SuperAdminLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Only super-admins may access this section.
  // The super-admin flag is stored in auth.users app_metadata.
  const isSuperAdmin =
    user.app_metadata?.role === "super-admin" ||
    user.app_metadata?.is_super_admin === true

  if (!isSuperAdmin) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              SA
            </div>
            <span>Super Admin</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-1 text-sm flex-1">
            {/* Navigation links will be populated in F17 */}
          </nav>
          <div className="ml-auto text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
