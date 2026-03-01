/**
 * Shared domain constants used by both server actions and client components.
 * Must NOT be inside "use server" files — client components cannot receive
 * non-function exports across the server boundary.
 */

// ── Projects ─────────────────────────────────────────────────────────────────

export const PROJECT_CATEGORIES = [
  "Infrastructure",
  "Landscaping",
  "Legal",
  "Administrative",
  "Other",
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const PROJECT_STATUSES = [
  { value: "proposed",    label: "Proposed"    },
  { value: "approved",    label: "Approved"    },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed"   },
  { value: "archived",    label: "Archived"    },
] as const

// ── Maintenance ───────────────────────────────────────────────────────────────

export const MAINTENANCE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Common Areas",
  "Elevator",
  "Other",
] as const

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]

// ── Initiatives ───────────────────────────────────────────────────────────────

export const INITIATIVE_CATEGORIES = [
  "Infrastructure",
  "Amenities",
  "Safety",
  "Environment",
  "Community",
  "Administrative",
  "Other",
] as const

export type InitiativeCategory = (typeof INITIATIVE_CATEGORIES)[number]
