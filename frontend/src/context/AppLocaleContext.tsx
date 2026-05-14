import { createContext } from "react";
import type { AppLocale } from "../translations";

interface AppLocaleContextType {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

export const AppLocaleContext = createContext<AppLocaleContextType | undefined>(
  undefined,
);
