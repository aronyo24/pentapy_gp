import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      aria-label="Toggle color theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggle}
      className="p-2 rounded-md hover:bg-secondary transition-base"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
