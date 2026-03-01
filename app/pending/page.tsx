import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { signOut } from "@/app/auth/actions"
import { getUser } from "@/lib/auth/get-user"
import { Button } from "@/components/ui/button"
import { Building2, Clock } from "lucide-react"

export default async function PendingPage() {
  const user = await getUser()

  if (!user) {
    redirect("/")
  }

  const t = await getTranslations("pending")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="h-8 w-8" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("desc", { email: user.email ?? "" })}
        </p>

        <div className="mt-6 rounded-xl border bg-card p-4 text-left text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <Building2 className="h-4 w-4" />
            <span>{t("whatNext")}</span>
          </div>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("contactAdmin")}</li>
            <li>{t("askInvite")}</li>
            <li>{t("receiveEmail")}</li>
          </ul>
        </div>

        <form action={signOut} className="mt-6">
          <Button variant="outline" className="w-full" type="submit">
            {t("signOut")}
          </Button>
        </form>
      </div>
    </div>
  )
}
