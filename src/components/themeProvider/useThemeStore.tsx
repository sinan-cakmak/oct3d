import { persist } from "zustand/middleware";
import { create } from "zustand/react";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const getDefaultTheme = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  }
  return "light";
};

const useThemeStore = create<ThemeState>()(
  persist<ThemeState>(
    (set) => ({
      theme: getDefaultTheme(),

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
