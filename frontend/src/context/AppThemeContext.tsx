import { createContext } from "react";

export type AppTheme = "light" | "dark";

interface AppThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const AppThemeContext = createContext<AppThemeContextType | undefined>(
  undefined,
);
