import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Separator } from "@/components/ui/separator"

interface CondominiumLayoutProps {
  children: React.ReactNode
  params: Promise<{ condominiumSlug: string }>
}

export default async function CondominiumLayout({
  children,
  params,
}: CondominiumLayoutProps) {
  const { condominiumSlug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: condominium } = await supabase
    .from("condominiums")
    .select("id, name, slug, logo_url")
    .eq("slug", condominiumSlug)
    .single()

  if (!condominium) {
    redirect("/")
  }

  // Verify membership
  const { data: member } = await supabase
    .from("condominium_members")
    .select("system_role")
    .eq("condominium_id", condominium.id)
    .eq("user_id", user.id)
    .single()

  if (!member) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            {condominium.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={condominium.logo_url}
                alt={condominium.name}
                className="h-7 w-7 rounded-md object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {condominium.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{condominium.name}</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-1 text-sm flex-1">
            {/* Navigation links will be populated in F05 */}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
