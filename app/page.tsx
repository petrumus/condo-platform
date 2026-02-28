import { redirect } from "next/navigation"
import { signInWithGoogle } from "@/app/auth/actions"
import { getUser } from "@/lib/auth/get-user"
import { getUserMemberships } from "@/lib/auth/get-membership"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

interface HomePageProps {
  searchParams: Promise<{ error?: string; next?: string }>
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

  const { error, next } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="h-14 w-14" />
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
          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {decodeURIComponent(error)}
            </p>
          )}

          <form action={signInWithGoogle}>
            {next && <input type="hidden" name="next" value={next} />}
            <Button type="submit" variant="outline" className="w-full gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            You&apos;ll be redirected to Google to complete sign in.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <span className="font-medium text-foreground">
            Contact your condominium administrator.
          </span>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          {" · "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}
