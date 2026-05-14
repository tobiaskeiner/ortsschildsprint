import { supportedLocales, type AppLocale } from "../translations";
import { useIntl } from "react-intl";

interface LocaleSwitcherProps {
  locale: AppLocale;
  onChange: (locale: AppLocale) => void;
}

const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({
  locale,
  onChange,
}) => {
  const intl = useIntl();

  return (
    <div
      aria-label={intl.formatMessage({ id: "menu.languageSwitcher" })}
      className="inline-flex items-center rounded-full bg-surface-container-low p-1 shadow-sm"
      role="group"
    >
      {supportedLocales.map((supportedLocale) => {
        const isSelected = supportedLocale === locale;
        const localeLabelId =
          supportedLocale === "de" ? "menu.language.de" : "menu.language.en";

        return (
          <button
            key={supportedLocale}
            aria-label={intl.formatMessage({ id: localeLabelId })}
            aria-pressed={isSelected}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:cursor-pointer sm:text-sm ${
              isSelected
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
            onClick={() => onChange(supportedLocale)}
            title={intl.formatMessage({ id: localeLabelId })}
            type="button"
          >
            {supportedLocale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};

export default LocaleSwitcher;
