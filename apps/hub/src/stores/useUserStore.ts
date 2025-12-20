import { create } from "zustand";

interface User {
  name: string;
  role: string;
  avatar: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: {
    name: "John Doe",
    role: "Admin",
    avatar: "",
  },
  setUser: (user) => set({ user }),
}));
