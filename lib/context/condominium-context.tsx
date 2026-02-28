"use client"

import { createContext, useContext } from "react"
import type { CondominiumBasic } from "@/lib/condominium/get-condominium"
import type { MemberRole } from "@/lib/types"

interface CondominiumContextValue {
  condominium: CondominiumBasic
  userRole: MemberRole
}

const CondominiumContext = createContext<CondominiumContextValue | null>(null)

export function CondominiumProvider({
  condominium,
  userRole,
  children,
}: CondominiumContextValue & { children: React.ReactNode }) {
  return (
    <CondominiumContext.Provider value={{ condominium, userRole }}>
      {children}
    </CondominiumContext.Provider>
  )
}

export function useCondominium(): CondominiumContextValue {
  const ctx = useContext(CondominiumContext)
  if (!ctx) {
    throw new Error("useCondominium must be used within a CondominiumProvider")
  }
  return ctx
}
