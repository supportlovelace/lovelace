import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Persona = "CM" | "DEV" | "CEO" | "ADMIN";

interface AppContextState {
  // Scope: liste des IDs de jeux sélectionnés. Vide [] = "Global/Studio"
  selectedGameIds: string[];
  
  // Persona actuel de l'utilisateur
  persona: Persona;

  // View mode pour le Hub
  hubViewMode: "modern" | "legacy";
  
  // Actions
  setGameScope: (ids: string[]) => void;
  setPersona: (persona: Persona) => void;
  setHubViewMode: (mode: "modern" | "legacy") => void;
  toggleGame: (id: string) => void;
  resetScope: () => void;
}

export const useAppContext = create<AppContextState>()(
  persist(
    (set) => ({
      selectedGameIds: [], // Par défaut: Vue Portfolio / Global
      persona: "ADMIN",    // Par défaut: Admin (accès à tout)
      hubViewMode: "modern",

      setGameScope: (ids) => set({ selectedGameIds: ids }),
      
      setPersona: (persona) => set({ persona }),

      setHubViewMode: (mode) => set({ hubViewMode: mode }),

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
