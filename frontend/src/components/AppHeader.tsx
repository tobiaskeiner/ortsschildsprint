import { FormattedMessage, useIntl } from "react-intl";
import type { AppLocale } from "../translations";
import type { AppRoute } from "../utils/appRoutes";
import type { Step } from "./Stepper";
import AppMenu from "./AppMenu";
import Stepper from "./Stepper";

interface AppHeaderProps {
  currentRoute: AppRoute;
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  onNavigate: (route: AppRoute) => void;
  showStepper: boolean;
  steps: Step[];
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentRoute,
  locale,
  onLocaleChange,
  onNavigate,
  showStepper,
  steps,
}) => {
  const desktopLayoutClassName = showStepper
    ? "md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center"
    : "md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center";

  const intl = useIntl();

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface-container-lowest/80 shadow-lg backdrop-blur-xl">
      <nav
        aria-label="Navigation"
        className={`mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:h-16 md:px-8 md:py-0 ${desktopLayoutClassName}`}
      >
        <div className="min-w-0 flex-1 md:flex-none md:overflow-hidden">
          <button
            className="max-w-full text-left text-xl font-headline font-black italic tracking-tighter uppercase transition-opacity hover:cursor-pointer hover:opacity-75 sm:text-2xl"
            onClick={() => onNavigate("/")}
            type="button"
            aria-label={intl.formatMessage({ id: "navbar.logo.label" })}
          >
            <FormattedMessage id="navbar.logo" />
          </button>
        </div>
        {showStepper && (
          <div
            className="hidden min-w-0 overflow-hidden md:flex md:justify-self-center"
            aria-label={intl.formatMessage({ id: "navbar.stepper.aria" })}
          >
            <Stepper steps={steps} />
          </div>
        )}
        <div className="flex shrink-0 justify-end md:justify-self-end">
          <AppMenu
            currentRoute={currentRoute}
            locale={locale}
            onLocaleChange={onLocaleChange}
            onNavigate={onNavigate}
          />
        </div>
      </nav>
    </header>
  );
};

export default AppHeader;
