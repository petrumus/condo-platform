export type { Database, Tables, TablesInsert, TablesUpdate, Json } from "./database"

// ─── Domain enums ─────────────────────────────────────────────────────────────

export type SystemRole = "super-admin" | "admin" | "user"

export type MemberRole = "admin" | "user"

export type BudgetStatus = "draft" | "published"

export type BallotStatus = "draft" | "open" | "closed"

export type BallotQuestionType = "single" | "multiple" | "yes_no"

export type MaintenancePriority = "low" | "medium" | "high" | "urgent"

export type DocumentVisibility = "public" | "members"

export type InitiativeStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "implemented"

export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled"

export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"

// ─── Augmented / joined types ─────────────────────────────────────────────────

import type { Tables } from "./database"

export type CondominiumMemberWithUser = Tables<"condominium_members"> & {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  functional_title: Tables<"functional_titles"> | null
}

export type BallotWithVoteCount = Tables<"ballots"> & {
  vote_count: number
}

export type DocumentWithFolder = Tables<"documents"> & {
  folder: Tables<"document_folders"> | null
}

export type NotificationWithCondominium = Tables<"notifications"> & {
  condominium: Pick<Tables<"condominiums">, "id" | "name" | "slug"> | null
}
