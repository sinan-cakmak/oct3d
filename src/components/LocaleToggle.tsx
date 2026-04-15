import { Button } from "@/components/ui/button";
import useLocaleStore from "@/i18n/useLocaleStore";
import useTranslation from "@/i18n/useTranslation";

export default function LocaleToggle({ className }: { className?: string }) {
  const toggleLocale = useLocaleStore((s) => s.toggleLocale);
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      aria-label={t("locale.switchTo")}
      title={t("locale.switchTo")}
      className={className}
    >
      <span className="text-xs font-semibold">{t("locale.current")}</span>
    </Button>
  );
}
