import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Terms of Service — Condo Platform",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 2026
        </p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using Condo Platform, you agree to be bound by these Terms of Service.
              If you do not agree, you may not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Use of the Platform</h2>
            <p className="mt-2">
              Condo Platform is provided for condominium management purposes. You agree to use it
              only for lawful purposes and in accordance with these terms. You are responsible for
              maintaining the confidentiality of your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. User Accounts</h2>
            <p className="mt-2">
              Access is granted by invitation from a condominium administrator. You must provide
              accurate information and notify your administrator of any unauthorized use of your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Data & Privacy</h2>
            <p className="mt-2">
              Your use of the platform is also governed by our{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              , which is incorporated into these terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Limitation of Liability</h2>
            <p className="mt-2">
              The platform is provided &quot;as is&quot; without warranties of any kind. We are not
              liable for any indirect, incidental, or consequential damages arising from your use of
              the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Changes to Terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use of the platform after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
            <p className="mt-2">
              For questions about these terms, please contact the platform administrator.
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
