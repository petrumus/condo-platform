import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreateCondominiumForm } from "./create-condominium-form"

export default function NewCondominiumPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/super-admin/condominiums">← Back</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Create Condominium</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a new condominium workspace on the platform.
        </p>
      </div>

      <CreateCondominiumForm />
    </div>
  )
}
