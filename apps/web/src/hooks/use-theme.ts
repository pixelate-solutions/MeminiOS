import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function initialTheme(): Theme {
  const stored = window.localStorage.getItem("meminios-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("meminios-theme", theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((value) => (value === "light" ? "dark" : "light")),
  };
}
