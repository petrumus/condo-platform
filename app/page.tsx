import { redirect } from "next/navigation"
import { signInWithMagicLink } from "@/app/auth/actions"
import { getUser } from "@/lib/auth/get-user"
import { getUserMemberships } from "@/lib/auth/get-membership"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"

interface HomePageProps {
  searchParams: Promise<{ error?: string; email?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getUser()

  if (user) {
    const memberships = await getUserMemberships(user.id)
    if (memberships.length > 0) {
      const first = memberships[0] as { condominiums: { slug: string } | null }
      if (first.condominiums?.slug) {
        redirect(`/app/${first.condominiums.slug}/dashboard`)
      }
    }
    redirect("/pending")
  }

  const { error, email } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Condo Platform
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage your condominium
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form action={signInWithMagicLink} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={email ? decodeURIComponent(email) : undefined}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {decodeURIComponent(error)}
              </p>
            )}

            <Button type="submit" className="w-full">
              Send magic link
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            We&apos;ll send a sign-in link to your email — no password needed.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <span className="font-medium text-foreground">
            Contact your condominium administrator.
          </span>
        </p>
      </div>
    </div>
  )
}
