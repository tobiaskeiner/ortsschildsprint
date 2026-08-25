import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { IntlProvider } from "react-intl";
import { router } from "./router";
import { AppLocaleContext } from "./context/AppLocaleContext";
import { AppThemeContext, type AppTheme } from "./context/AppThemeContext";
import { GeoJsonProvider } from "./context/GeoJsonContext";
import { isAppLocale, messages, type AppLocale } from "./translations";

const LOCALE_STORAGE_KEY = "app-locale";
const THEME_STORAGE_KEY = "app-theme";

const getInitialLocale = () => {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isAppLocale(storedLocale)) return storedLocale;

  return window.navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
};

const isAppTheme = (value: string | null): value is AppTheme =>
  value === "light" || value === "dark";

const getInitialTheme = (): AppTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isAppTheme(storedTheme)) return storedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const App: React.FC = () => {
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale);
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <AppLocaleContext value={{ locale, setLocale }}>
      <AppThemeContext value={{ theme, setTheme }}>
        <IntlProvider
          messages={messages[locale]}
          locale={locale}
          defaultLocale="de"
        >
          <GeoJsonProvider>
            <RouterProvider router={router} />
          </GeoJsonProvider>
        </IntlProvider>
      </AppThemeContext>
    </AppLocaleContext>
  );
};

export default App;
