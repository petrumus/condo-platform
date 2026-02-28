import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ condominiumSlug: string }>
}

export default async function CondominiumRootPage({ params }: Props) {
  const { condominiumSlug } = await params
  redirect(`/app/${condominiumSlug}/dashboard`)
}
