import { useIntl } from "react-intl";
import type { AppTheme } from "../context/AppThemeContext";

interface ThemeSwitcherProps {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onChange }) => {
  const intl = useIntl();

  const options: { icon: string; theme: AppTheme; titleId: string }[] = [
    { icon: "light_mode", theme: "light", titleId: "menu.theme.light" },
    { icon: "dark_mode", theme: "dark", titleId: "menu.theme.dark" },
  ];

  return (
    <div
      aria-label={intl.formatMessage({ id: "menu.themeSwitcher" })}
      className="inline-flex items-center rounded-full bg-surface-container-low p-1 shadow-sm"
      role="group"
    >
      {options.map((option) => {
        const isSelected = theme === option.theme;

        return (
          <button
            key={option.theme}
            aria-label={intl.formatMessage({ id: option.titleId })}
            aria-pressed={isSelected}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full p-0 transition-colors hover:cursor-pointer ${
              isSelected
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
            onClick={() => onChange(option.theme)}
            title={intl.formatMessage({ id: option.titleId })}
            type="button"
          >
            <span className="material-symbols-outlined block text-[1rem] leading-none">
              {option.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
