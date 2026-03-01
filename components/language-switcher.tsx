"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { setLocale } from "@/app/actions/set-locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("languageSwitcher")

  async function handleChange(newLocale: string) {
    await setLocale(newLocale)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title={t("label")}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleChange("ro")}
          className={locale === "ro" ? "font-medium text-foreground" : ""}
        >
          {t("ro")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleChange("ru")}
          className={locale === "ru" ? "font-medium text-foreground" : ""}
        >
          {t("ru")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
