import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { IntlProvider } from "react-intl";
import { router } from "./router";
import { AppLocaleContext } from "./context/AppLocaleContext";
import { GeoJsonProvider } from "./context/GeoJsonContext";
import { isAppLocale, messages, type AppLocale } from "./translations";

const LOCALE_STORAGE_KEY = "app-locale";

const getInitialLocale = () => {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isAppLocale(storedLocale)) return storedLocale;

  return window.navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
};

const App: React.FC = () => {
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <AppLocaleContext value={{ locale, setLocale }}>
      <IntlProvider
        messages={messages[locale]}
        locale={locale}
        defaultLocale="de"
      >
        <GeoJsonProvider>
          <RouterProvider router={router} />
        </GeoJsonProvider>
      </IntlProvider>
    </AppLocaleContext>
  );
};

export default App;
