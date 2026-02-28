"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateCondominiumInfo, updateCondominiumLogo } from "./actions"

interface GeneralSettingsFormProps {
  condominiumSlug: string
  condominium: {
    id: string
    name: string
    slug: string
    address: string | null
    description: string | null
    logo_url: string | null
  }
}

export function GeneralSettingsForm({ condominiumSlug, condominium }: GeneralSettingsFormProps) {
  const [name, setName] = useState(condominium.name)
  const [address, setAddress] = useState(condominium.address ?? "")
  const [description, setDescription] = useState(condominium.description ?? "")
  const [infoStatus, setInfoStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [logoStatus, setLogoStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInfoLoading(true)
    setInfoStatus(null)
    try {
      await updateCondominiumInfo(condominiumSlug, { name, address, description })
      setInfoStatus({ ok: true, message: "Changes saved successfully." })
    } catch (err) {
      setInfoStatus({
        ok: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setInfoLoading(false)
    }
  }

  async function handleLogoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setLogoLoading(true)
    setLogoStatus(null)
    try {
      await updateCondominiumLogo(condominiumSlug, formData)
      setLogoStatus({ ok: true, message: "Logo updated successfully." })
      form.reset()
    } catch (err) {
      setLogoStatus({
        ok: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setLogoLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Condominium info form */}
      <form onSubmit={handleInfoSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Condominium Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, City, ZIP"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the condominium"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            value={condominium.slug}
            disabled
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            The slug is part of your condominium&apos;s URL and cannot be changed after creation.
          </p>
        </div>

        {infoStatus && (
          <div
            className={`text-sm px-3 py-2 rounded-md border ${
              infoStatus.ok
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {infoStatus.message}
          </div>
        )}

        <Button type="submit" disabled={infoLoading}>
          {infoLoading ? "Saving…" : "Save Changes"}
        </Button>
      </form>

      {/* Logo upload */}
      <div className="pt-6 border-t border-border">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Logo</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Square image recommended. Max 2 MB.
          </p>
        </div>

        {condominium.logo_url && (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={condominium.logo_url}
              alt="Current logo"
              className="h-16 w-16 rounded-md object-cover border border-border"
            />
          </div>
        )}

        <form onSubmit={handleLogoSubmit} className="flex flex-wrap items-start gap-3">
          <Input
            type="file"
            name="logo"
            accept="image/*"
            required
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={logoLoading}>
            {logoLoading ? "Uploading…" : "Upload Logo"}
          </Button>
          {logoStatus && (
            <div
              className={`text-sm px-3 py-2 rounded-md border ${
                logoStatus.ok
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {logoStatus.message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
