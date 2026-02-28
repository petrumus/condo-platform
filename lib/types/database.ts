export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      condominiums: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          address: string | null
          description: string | null
          slug: string
          status: "active" | "suspended"
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          address?: string | null
          description?: string | null
          slug: string
          status?: "active" | "suspended"
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          address?: string | null
          description?: string | null
          slug?: string
          status?: "active" | "suspended"
          created_at?: string
        }
        Relationships: []
      }
      condominium_members: {
        Row: {
          id: string
          condominium_id: string
          user_id: string
          system_role: "admin" | "user"
          functional_title_id: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          user_id: string
          system_role?: "admin" | "user"
          functional_title_id?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          user_id?: string
          system_role?: "admin" | "user"
          functional_title_id?: string | null
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condominium_members_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condominium_members_functional_title_id_fkey"
            columns: ["functional_title_id"]
            isOneToOne: false
            referencedRelation: "functional_titles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      functional_titles: {
        Row: {
          id: string
          condominium_id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          condominium_id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          condominium_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "functional_titles_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      units: {
        Row: {
          id: string
          condominium_id: string
          unit_number: string
          floor: number | null
          area_m2: number | null
          ownership_share_pct: number | null
        }
        Insert: {
          id?: string
          condominium_id: string
          unit_number: string
          floor?: number | null
          area_m2?: number | null
          ownership_share_pct?: number | null
        }
        Update: {
          id?: string
          condominium_id?: string
          unit_number?: string
          floor?: number | null
          area_m2?: number | null
          ownership_share_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      unit_owners: {
        Row: {
          id: string
          unit_id: string
          user_id: string | null
          owner_name: string
          owner_email: string | null
        }
        Insert: {
          id?: string
          unit_id: string
          user_id?: string | null
          owner_name: string
          owner_email?: string | null
        }
        Update: {
          id?: string
          unit_id?: string
          user_id?: string | null
          owner_name?: string
          owner_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_owners_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_plans: {
        Row: {
          id: string
          condominium_id: string
          year: number
          status: "draft" | "published"
          published_at: string | null
        }
        Insert: {
          id?: string
          condominium_id: string
          year: number
          status?: "draft" | "published"
          published_at?: string | null
        }
        Update: {
          id?: string
          condominium_id?: string
          year?: number
          status?: "draft" | "published"
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_plans_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      budget_line_items: {
        Row: {
          id: string
          budget_plan_id: string
          category: string
          amount: number
          notes: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          budget_plan_id: string
          category: string
          amount: number
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          budget_plan_id?: string
          category?: string
          amount?: number
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_items_budget_plan_id_fkey"
            columns: ["budget_plan_id"]
            isOneToOne: false
            referencedRelation: "budget_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          condominium_id: string
          title: string
          description: string | null
          category: string | null
          status: string
          estimated_cost: number | null
          actual_cost: number | null
          start_date: string | null
          end_date: string | null
          responsible_person: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          title: string
          description?: string | null
          category?: string | null
          status?: string
          estimated_cost?: number | null
          actual_cost?: number | null
          start_date?: string | null
          end_date?: string | null
          responsible_person?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          title?: string
          description?: string | null
          category?: string | null
          status?: string
          estimated_cost?: number | null
          actual_cost?: number | null
          start_date?: string | null
          end_date?: string | null
          responsible_person?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      project_updates: {
        Row: {
          id: string
          project_id: string
          body: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          body: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          body?: string
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      initiatives: {
        Row: {
          id: string
          condominium_id: string
          title: string
          description: string | null
          category: string | null
          status: string
          submitter_id: string
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          title: string
          description?: string | null
          category?: string | null
          status?: string
          submitter_id: string
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          title?: string
          description?: string | null
          category?: string | null
          status?: string
          submitter_id?: string
          admin_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      ballots: {
        Row: {
          id: string
          condominium_id: string
          title: string
          description: string | null
          question_type: "single" | "multiple" | "yes_no"
          options: Json
          open_at: string
          close_at: string
          quorum_pct: number | null
          linked_initiative_id: string | null
          status: "draft" | "open" | "closed"
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          title: string
          description?: string | null
          question_type?: "single" | "multiple" | "yes_no"
          options?: Json
          open_at: string
          close_at: string
          quorum_pct?: number | null
          linked_initiative_id?: string | null
          status?: "draft" | "open" | "closed"
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          title?: string
          description?: string | null
          question_type?: "single" | "multiple" | "yes_no"
          options?: Json
          open_at?: string
          close_at?: string
          quorum_pct?: number | null
          linked_initiative_id?: string | null
          status?: "draft" | "open" | "closed"
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballots_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_linked_initiative_id_fkey"
            columns: ["linked_initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          ballot_id: string
          voter_id: string
          selected_options: Json
          voted_at: string
        }
        Insert: {
          id?: string
          ballot_id: string
          voter_id: string
          selected_options: Json
          voted_at?: string
        }
        Update: {
          id?: string
          ballot_id?: string
          voter_id?: string
          selected_options?: Json
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          condominium_id: string
          folder_id: string | null
          name: string
          storage_path: string
          visibility_override: "public" | "members" | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          folder_id?: string | null
          name: string
          storage_path: string
          visibility_override?: "public" | "members" | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          folder_id?: string | null
          name?: string
          storage_path?: string
          visibility_override?: "public" | "members" | null
          uploaded_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          }
        ]
      }
      document_folders: {
        Row: {
          id: string
          condominium_id: string
          parent_folder_id: string | null
          name: string
          default_visibility: "public" | "members"
        }
        Insert: {
          id?: string
          condominium_id: string
          parent_folder_id?: string | null
          name: string
          default_visibility?: "public" | "members"
        }
        Update: {
          id?: string
          condominium_id?: string
          parent_folder_id?: string | null
          name?: string
          default_visibility?: "public" | "members"
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          condominium_id: string
          title: string
          body: string
          pinned: boolean
          published_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          title: string
          body: string
          pinned?: boolean
          published_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          title?: string
          body?: string
          pinned?: boolean
          published_at?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_requests: {
        Row: {
          id: string
          condominium_id: string
          submitter_id: string
          title: string
          description: string | null
          category: string | null
          location: string | null
          priority: "low" | "medium" | "high" | "urgent"
          status: string
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          submitter_id: string
          title: string
          description?: string | null
          category?: string | null
          location?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          status?: string
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          submitter_id?: string
          title?: string
          description?: string | null
          category?: string | null
          location?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          status?: string
          admin_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          condominium_id: string
          type: string
          title: string
          body: string
          read: boolean
          link_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          condominium_id: string
          type: string
          title: string
          body: string
          read?: boolean
          link_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          condominium_id?: string
          type?: string
          title?: string
          body?: string
          read?: boolean
          link_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          condominium_id: string | null
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id?: string | null
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string | null
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          condominium_id: string
          email: string
          role: "admin" | "user"
          token: string
          accepted_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominium_id: string
          email: string
          role: "admin" | "user"
          token?: string
          accepted_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          condominium_id?: string
          email?: string
          role?: "admin" | "user"
          token?: string
          accepted_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
