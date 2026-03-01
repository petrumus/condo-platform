import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ condominiumSlug: string }>
}

export default async function BudgetIndexPage({ params }: PageProps) {
  const { condominiumSlug } = await params
  const currentYear = new Date().getFullYear()
  redirect(`/app/${condominiumSlug}/budget/${currentYear}`)
}
