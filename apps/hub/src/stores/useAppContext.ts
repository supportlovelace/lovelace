import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Persona = "CM" | "DEV" | "CEO" | "ADMIN";

interface AppContextState {
  // Scope: liste des IDs de jeux sélectionnés. Vide [] = "Global/Studio"
  selectedGameIds: string[];
  
  // Persona actuel de l'utilisateur
  persona: Persona;
  
  // Actions
  setGameScope: (ids: string[]) => void;
  setPersona: (persona: Persona) => void;
  toggleGame: (id: string) => void;
  resetScope: () => void;
}

export const useAppContext = create<AppContextState>()(
  persist(
    (set) => ({
      selectedGameIds: [], // Par défaut: Vue Portfolio / Global
      persona: "ADMIN",    // Par défaut: Admin (accès à tout)

      setGameScope: (ids) => set({ selectedGameIds: ids }),
      
      setPersona: (persona) => set({ persona }),

      toggleGame: (id) => set((state) => {
        const isSelected = state.selectedGameIds.includes(id);
        if (isSelected) {
          return { selectedGameIds: state.selectedGameIds.filter(gid => gid !== id) };
        } else {
          return { selectedGameIds: [...state.selectedGameIds, id] };
        }
      }),

      resetScope: () => set({ selectedGameIds: [] }),
    }),
    {
      name: "lovelace-app-context", // Persistance dans le localStorage
    }
  )
);
