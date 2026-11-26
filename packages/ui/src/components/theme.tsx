"use client";

import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import * as React from "react";
import * as z from "zod";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const ThemeModeSchema = z.enum(["light", "dark", "auto"]);

const themeKey = "theme-mode";

export type ThemeMode = z.output<typeof ThemeModeSchema>;
export type ResolvedTheme = Exclude<ThemeMode, "auto">;

const getStoredThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "auto";
  try {
    const storedTheme = localStorage.getItem(themeKey);
    return ThemeModeSchema.parse(storedTheme);
  } catch {
    return "auto";
  }
};

const setStoredThemeMode = (theme: ThemeMode) => {
  try {
    const parsedTheme = ThemeModeSchema.parse(theme);
    localStorage.setItem(themeKey, parsedTheme);
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const updateThemeClass = (themeMode: ThemeMode) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark", "auto");
  const newTheme = themeMode === "auto" ? getSystemTheme() : themeMode;
  root.classList.add(newTheme);

  if (themeMode === "auto") {
    root.classList.add("auto");
  }
};

const getNextTheme = (current: ThemeMode): ThemeMode => {
  const themes: ThemeMode[] =
    getSystemTheme() === "dark"
      ? ["auto", "light", "dark"]
      : ["auto", "dark", "light"];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return themes[(themes.indexOf(current) + 1) % themes.length]!;
};

export const themeDetectorScript = (() => {
  function themeFn() {
    const isValidTheme = (theme: string): theme is ThemeMode => {
      const validThemes = ["light", "dark", "auto"] as const;
      return validThemes.includes(theme as ThemeMode);
    };

    let storedTheme = "auto";
    try {
      storedTheme = localStorage.getItem("theme-mode") ?? "auto";
    } catch {
      storedTheme = "auto";
    }
    const validTheme = isValidTheme(storedTheme) ? storedTheme : "auto";

    if (validTheme === "auto") {
      const autoTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      document.documentElement.classList.add(autoTheme, "auto");
    } else {
      document.documentElement.classList.add(validTheme);
    }
  }
  return `(${themeFn.toString()})();`;
})();

interface ThemeContextProps {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleMode: () => void;
}
const ThemeContext = React.createContext<ThemeContextProps | undefined>(
  undefined
);

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("auto");
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>("light");

  React.useEffect(() => {
    setThemeMode(getStoredThemeMode());
    setSystemTheme(getSystemTheme());
  }, []);

  React.useEffect(() => {
    if (themeMode !== "auto") return;
    setSystemTheme(getSystemTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setSystemTheme(getSystemTheme());
      updateThemeClass("auto");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [themeMode]);

  const resolvedTheme = themeMode === "auto" ? systemTheme : themeMode;

  const setTheme = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    setStoredThemeMode(newTheme);
    updateThemeClass(newTheme);
  };

  const toggleMode = () => {
    setTheme(getNextTheme(themeMode));
  };

  return (
    <ThemeContext
      value={{
        themeMode,
        resolvedTheme,
        setTheme,
        toggleMode,
      }}
    >
      <script
        dangerouslySetInnerHTML={{ __html: themeDetectorScript }}
        suppressHydrationWarning
      />
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = React.use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeToggle() {
  const { themeMode, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const Icon = !mounted || themeMode === "auto"
    ? MonitorIcon
    : themeMode === "dark"
      ? MoonIcon
      : SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Сменить тему"
            title="Сменить тему"
            className="shadow-sm transition-colors duration-240 hover:border-primary/45 hover:text-primary"
          />
        }
      >
        <Icon className="size-4.5" />
        <span className="sr-only">Сменить тему</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon />
          Светлая
          {mounted && themeMode === "light" && (
            <CheckIcon className="ml-auto size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon />
          Тёмная
          {mounted && themeMode === "dark" && (
            <CheckIcon className="ml-auto size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("auto")}>
          <MonitorIcon />
          Системная
          {(!mounted || themeMode === "auto") && (
            <CheckIcon className="ml-auto size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
