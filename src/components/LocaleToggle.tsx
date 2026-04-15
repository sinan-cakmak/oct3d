import useLocaleStore from "@/i18n/useLocaleStore";

export default function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const toggleLocale = useLocaleStore((s) => s.toggleLocale);

  return (
    <button
      onClick={toggleLocale}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-accent/60 transition-colors ${className ?? ""}`}
    >
      <span className={locale === "tr" ? "text-foreground font-semibold" : "text-muted-foreground"}>TR</span>
      <span className="text-muted-foreground/40">|</span>
      <span className={locale === "en" ? "text-foreground font-semibold" : "text-muted-foreground"}>EN</span>
    </button>
  );
}
