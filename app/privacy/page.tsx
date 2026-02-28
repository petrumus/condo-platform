import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Privacy Policy — Condo Platform",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 2026
        </p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide when creating an account, including your name and
              email address via Google OAuth. We also collect usage data to operate and improve the
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="mt-2">
              Your information is used solely to provide the Condo Platform service — enabling you to
              manage your condominium, communicate with members, and access platform features. We do
              not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Data Storage</h2>
            <p className="mt-2">
              Data is stored securely using Supabase (PostgreSQL). Access is restricted by
              row-level security policies that enforce tenant isolation between condominiums.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Third-Party Services</h2>
            <p className="mt-2">
              We use Google OAuth for authentication. By signing in with Google, you agree to
              Google&apos;s{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Contact</h2>
            <p className="mt-2">
              For privacy-related questions, please contact the platform administrator.
            </p>
          </section>
        </div>

        <Button variant="outline" className="mt-10" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
