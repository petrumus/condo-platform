"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile, uploadAvatar } from "./actions"

interface ProfileFormProps {
  profile: {
    full_name: string | null
    avatar_url: string | null
  }
  userEmail: string
}

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? "")
  const [nameStatus, setNameStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [avatarStatus, setAvatarStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [nameLoading, setNameLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameLoading(true)
    setNameStatus(null)
    try {
      await updateProfile({ full_name: fullName })
      setNameStatus({ ok: true, message: "Profile updated successfully." })
    } catch (err) {
      setNameStatus({
        ok: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setNameLoading(false)
    }
  }

  async function handleAvatarSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setAvatarLoading(true)
    setAvatarStatus(null)
    try {
      await uploadAvatar(formData)
      setAvatarStatus({ ok: true, message: "Photo updated successfully." })
      form.reset()
    } catch (err) {
      setAvatarStatus({
        ok: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Name form */}
      <form onSubmit={handleNameSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={userEmail}
            disabled
            className="text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Email is managed by your Google account and cannot be changed here.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full-name">Display Name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {nameStatus && (
          <div
            className={`text-sm px-3 py-2 rounded-md border ${
              nameStatus.ok
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {nameStatus.message}
          </div>
        )}

        <Button type="submit" disabled={nameLoading}>
          {nameLoading ? "Saving…" : "Save Changes"}
        </Button>
      </form>

      {/* Avatar upload */}
      <div className="pt-6 border-t border-border">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Profile Photo</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Square image recommended. Max 2 MB.
          </p>
        </div>

        {profile.avatar_url && (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar_url}
              alt="Current profile photo"
              className="h-16 w-16 rounded-full object-cover border border-border"
            />
          </div>
        )}

        <form onSubmit={handleAvatarSubmit} className="flex flex-wrap items-start gap-3">
          <Input
            type="file"
            name="avatar"
            accept="image/*"
            required
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={avatarLoading}>
            {avatarLoading ? "Uploading…" : "Upload Photo"}
          </Button>
          {avatarStatus && (
            <div
              className={`text-sm px-3 py-2 rounded-md border ${
                avatarStatus.ok
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {avatarStatus.message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
