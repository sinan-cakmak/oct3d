import { persist } from "zustand/middleware";
import { create } from "zustand/react";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist<ThemeState>(
    (set) => ({
      theme: "light",

      setTheme: (theme: string) => set({ theme }),

      toggleTheme: () =>
        set((state: { theme: string }) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
    }),
    {
      name: "theme",
    }
  )
);

export default useThemeStore;
