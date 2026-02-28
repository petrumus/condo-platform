import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { acceptInvitation } from "./actions"
import { Button } from "@/components/ui/button"
import { Building2, UserCheck } from "lucide-react"
import Link from "next/link"

interface InvitePageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params
  const { error } = await searchParams

  // Look up the invitation (public, via service client)
  const serviceClient = await createServiceClient()
  const { data: invitation } = await serviceClient
    .from("invitations")
    .select("*, condominiums ( name, slug )")
    .eq("token", token)
    .is("accepted_at", null)
    .single()

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Invalid invitation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation link is invalid or has already been used.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/">Go to sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  const condo = invitation.condominiums as { name: string; slug: string } | null
  const user = await getUser()

  // If user is signed in and their email matches, show accept button
  // Otherwise, prompt them to sign in first
  const emailMatches =
    user && user.email?.toLowerCase() === invitation.email.toLowerCase()

  if (user && emailMatches) {
    // Already a member? Redirect straight to dashboard
    const { data: existing } = await serviceClient
      .from("condominium_members")
      .select("id")
      .eq("condominium_id", invitation.condominium_id)
      .eq("user_id", user.id)
      .single()

    if (existing && condo?.slug) {
      redirect(`/app/${condo.slug}/dashboard`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              You&apos;re invited
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {condo?.name ?? "A condominium"} has invited you to join their
              platform
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {/* Invitation details */}
          <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>
                Invited as{" "}
                <span className="font-medium capitalize text-foreground">
                  {invitation.role}
                </span>{" "}
                · {invitation.email}
              </span>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {decodeURIComponent(error)}
            </p>
          )}

          {emailMatches ? (
            // Signed in with matching email — show accept form
            <form action={acceptInvitation.bind(null, token)}>
              <Button type="submit" className="w-full">
                Accept invitation
              </Button>
            </form>
          ) : user ? (
            // Signed in with a different email
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You&apos;re signed in as{" "}
                <span className="font-medium text-foreground">{user.email}</span>
                , but this invitation was sent to{" "}
                <span className="font-medium text-foreground">
                  {invitation.email}
                </span>
                .
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Sign in with a different account</Link>
              </Button>
            </div>
          ) : (
            // Not signed in
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in with{" "}
                <span className="font-medium text-foreground">
                  {invitation.email}
                </span>{" "}
                to accept this invitation.
              </p>
              <Button className="w-full" asChild>
                <Link href={`/?email=${encodeURIComponent(invitation.email)}`}>
                  Sign in to accept
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
