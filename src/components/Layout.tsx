import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Eye } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Eye className="h-6 w-6 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">3D OCT Viewer</h1>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
