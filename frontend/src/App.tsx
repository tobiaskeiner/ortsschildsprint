import { useEffect, useState } from "react";
import type { Step } from "./components/Stepper";
import Home from "./steps/Home";
import { GeoJsonProvider } from "./context/GeoJsonContext";
import Edit from "./steps/Edit";
import Export from "./steps/Export";
import Preview from "./steps/Preview";
import { FormattedMessage, IntlProvider } from "react-intl";
import AppHeader from "./components/AppHeader";
import LegalPage from "./components/LegalPage";
import { isAppLocale, messages, type AppLocale } from "./translations";
import {
  MAIN_ROUTE,
  normalizeAppRoute,
  type AppRoute,
} from "./utils/appRoutes";
import PrivacyPolicy from "./components/PrivacyPolicy";

const LOCALE_STORAGE_KEY = "app-locale";

const getInitialLocale = () => {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isAppLocale(storedLocale)) return storedLocale;

  return window.navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
};

const getInitialRoute = (): AppRoute => {
  if (typeof window === "undefined") {
    return MAIN_ROUTE;
  }

  return normalizeAppRoute(window.location.pathname);
};

const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsingDoneSuccess, setParsingDoneSuccess] = useState(false);
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(normalizeAppRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const normalizedRoute = normalizeAppRoute(window.location.pathname);

    if (normalizedRoute !== window.location.pathname) {
      window.history.replaceState({}, "", normalizedRoute);
    }
  }, []);

  const navigateTo = (route: AppRoute) => {
    if (route === currentRoute) return;

    window.history.pushState({}, "", route);
    setCurrentRoute(route);
    window.scrollTo({ left: 0, top: 0 });
  };

  const steps: Step[] = [
    {
      text: <FormattedMessage id="stepper.upload" />,
      icon: "1",
      onClick: () => setStep(1),
      selected: step === 1,
    },
    {
      text: <FormattedMessage id="stepper.edit" />,
      icon: "2",
      onClick: () => setStep(2),
      selected: step === 2,
    },
    {
      text: <FormattedMessage id="stepper.export" />,
      icon: "3",
      onClick: () => setStep(3),
      selected: step === 3,
    },
  ];

  const mobileSteps = [
    { step: 1 as const, icon: "upload_file", labelId: "stepper.upload" },
    { step: 2 as const, icon: "location_on", labelId: "stepper.edit" },
    { step: 3 as const, icon: "file_download", labelId: "stepper.export" },
  ];
  const isMainRoute = currentRoute === MAIN_ROUTE;

  return (
    <GeoJsonProvider>
      <IntlProvider
        messages={messages[locale]}
        locale={locale}
        defaultLocale="en"
      >
        <div className="min-h-screen bg-surface">
          <AppHeader
            currentRoute={currentRoute}
            locale={locale}
            onLocaleChange={setLocale}
            onNavigate={navigateTo}
            showStepper={isMainRoute}
            steps={steps}
          />
          <main
            className={`mx-auto flex min-h-screen max-w-[1440px] flex-col bg-surface px-3 pt-20 sm:px-5 md:px-8 md:pt-24 ${
              isMainRoute ? "pb-24 md:pb-12" : "pb-10 md:pb-12"
            }`}
          >
            {isMainRoute ? (
              <>
                {step === 1 &&
                  (parsingDoneSuccess ? (
                    <Preview onContinue={() => setStep(2)} />
                  ) : (
                    <Home setParseSuccessful={setParsingDoneSuccess} />
                  ))}
                {step === 2 && (
                  <Edit
                    onContinue={() => setStep(3)}
                    onBack={() => setStep(1)}
                  />
                )}
                {step === 3 && <Export />}
              </>
            ) : currentRoute === "/legal-notice" ? (
              <LegalPage titleId="legalnotice.title" />
            ) : (
              <PrivacyPolicy titleId="legal.privacyPolicy.title" />
            )}
          </main>
          {isMainRoute && (
            <nav className="fixed inset-x-4 bottom-3 z-50 rounded-[1.5rem] bg-surface-container-lowest/78 px-1.5 py-1.5 shadow-lg backdrop-blur-lg md:hidden">
              <div className="grid grid-cols-3 gap-1.5">
                {mobileSteps.map(({ step: mobileStep, icon, labelId }) => {
                  const isSelected = step === mobileStep;

                  return (
                    <button
                      key={labelId}
                      aria-label={messages[locale][labelId]}
                      className={`flex items-center justify-center rounded-[1rem] px-3 py-2.5 transition-colors hover:cursor-pointer ${
                        isSelected
                          ? "bg-surface-container-high text-primary"
                          : "text-secondary/80 hover:bg-surface-container-low"
                      }`}
                      onClick={() => setStep(mobileStep)}
                      type="button"
                    >
                      <span className="sr-only">
                        <FormattedMessage id={labelId} />
                      </span>
                      <span className="material-symbols-outlined text-[1.2rem]">
                        {icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </IntlProvider>
    </GeoJsonProvider>
  );
};

export default App;
