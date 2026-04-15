import useLocaleStore from "./useLocaleStore";
import translations, { type TranslationKey } from "./translations";

export default function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const dict = translations[locale];

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let str: string = dict[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }

  return { t, locale };
}
