import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import LocaleToggle from "./LocaleToggle";
import useTranslation from "@/i18n/useTranslation";

export default function Layout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/kuis-ai-logo.png" alt="KUIS AI" className="h-8 w-auto" />
            <div className="h-5 w-px bg-border/60 hidden sm:block" />
            <h1 className="text-xl font-bold text-foreground">{t("layout.title")}</h1>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
              <Link to="/guide">
                <BookOpen className="h-4 w-4" />
                {t("layout.guide")}
              </Link>
            </Button>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
