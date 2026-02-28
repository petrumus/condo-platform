import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const { email } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-8 w-8" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a magic link to{" "}
          {email ? (
            <span className="font-medium text-foreground">
              {decodeURIComponent(email)}
            </span>
          ) : (
            "your email address"
          )}
          . Click the link to sign in.
        </p>

        <div className="mt-6 rounded-xl border bg-card p-4 text-left text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Didn&apos;t receive it?</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email</li>
            <li>The link expires in 1 hour</li>
          </ul>
        </div>

        <Button variant="outline" className="mt-6 w-full" asChild>
          <Link href="/">Try a different email</Link>
        </Button>
      </div>
    </div>
  )
}
