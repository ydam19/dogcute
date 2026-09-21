import { createContext, useContext, useState, ReactNode } from 'react'
import { PetIDCard } from '../types/pet'

interface PetContextValue {
  card: PetIDCard | null
  setCard: (card: PetIDCard) => void
}

const PetContext = createContext<PetContextValue | null>(null)

export function PetProvider({ children }: { children: ReactNode }) {
  const [card, setCard] = useState<PetIDCard | null>(null)
  return (
    <PetContext.Provider value={{ card, setCard }}>
      {children}
    </PetContext.Provider>
  )
}

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet must be used inside PetProvider')
  return ctx
}
