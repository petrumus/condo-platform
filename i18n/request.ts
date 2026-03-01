import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

const SUPPORTED_LOCALES = ["ro", "ru"] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

function isValid(locale: string | undefined): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale)
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Try URL segment locale (unused in cookie-based setup, but handle gracefully)
  let locale = await requestLocale

  // Fall back to NEXT_LOCALE cookie
  if (!locale || !isValid(locale)) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value
    locale = isValid(cookieLocale) ? cookieLocale : "ro"
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
