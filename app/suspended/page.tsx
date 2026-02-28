import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <span className="text-destructive text-xl font-bold">!</span>
        </div>
        <h1 className="text-2xl font-semibold">Condominium Suspended</h1>
        <p className="text-muted-foreground">
          This condominium workspace has been suspended by a platform
          administrator. Please contact support if you believe this is an error.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button asChild variant="outline">
            <Link href="/app">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
