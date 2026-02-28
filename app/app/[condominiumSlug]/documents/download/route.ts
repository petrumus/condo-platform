import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth/get-user"
import { getCondominium } from "@/lib/condominium/get-condominium"
import { getUserRole } from "@/lib/condominium/get-user-role"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ condominiumSlug: string }> }
) {
  const { condominiumSlug } = await params
  const { searchParams } = request.nextUrl
  const documentId = searchParams.get("id")

  if (!documentId) {
    return NextResponse.json({ error: "Missing document ID" }, { status: 400 })
  }

  const user = await getUser()
  const condominium = await getCondominium(condominiumSlug)

  if (!condominium) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const supabase = await createClient()

  // Fetch document
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, visibility_override, folder_id, name")
    .eq("id", documentId)
    .eq("condominium_id", condominium.id)
    .single()

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Resolve effective visibility
  let effectiveVisibility = doc.visibility_override

  if (!effectiveVisibility && doc.folder_id) {
    const { data: folder } = await supabase
      .from("document_folders")
      .select("default_visibility")
      .eq("id", doc.folder_id)
      .single()
    effectiveVisibility = folder?.default_visibility ?? "members"
  } else if (!effectiveVisibility) {
    effectiveVisibility = "members"
  }

  // Access check
  if (effectiveVisibility === "admin-only") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = await getUserRole(user.id, condominium.id)
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } else if (effectiveVisibility === "members") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = await getUserRole(user.id, condominium.id)
    if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // "public" — allow without auth

  // Generate signed URL (60 second TTL)
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60)

  if (error || !data) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
