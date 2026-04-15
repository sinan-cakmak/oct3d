import { create } from "zustand";

export type Locale = "en" | "tr";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const stored = localStorage.getItem("locale") as Locale | null;

const useLocaleStore = create<LocaleState>((set) => ({
  locale: stored === "tr" ? "tr" : "en",
  setLocale: (locale) => {
    localStorage.setItem("locale", locale);
    set({ locale });
  },
  toggleLocale: () =>
    set((state) => {
      const next = state.locale === "en" ? "tr" : "en";
      localStorage.setItem("locale", next);
      return { locale: next };
    }),
}));

export default useLocaleStore;
