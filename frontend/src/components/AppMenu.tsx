import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import type { AppLocale } from "../translations";
import type { AppRoute } from "../utils/appRoutes";
import LocaleSwitcher from "./LocaleSwitcher";

interface AppMenuProps {
  currentRoute: AppRoute;
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  onNavigate: (route: AppRoute) => void;
}

interface MenuActionProps {
  active?: boolean;
  href?: string;
  icon: string;
  imageSrc?: string;
  labelId: string;
  onClick?: () => void;
}

const baseActionClassName =
  "flex w-full items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left transition-colors text-on-surface";

const MenuAction: React.FC<MenuActionProps> = ({
  active = false,
  href,
  icon,
  imageSrc,
  labelId,
  onClick,
}) => {
  const className = `${baseActionClassName} ${
    active ? "bg-primary-container/35" : "hover:bg-surface-container-low"
  }`;

  const content = (
    <>
      {imageSrc ? (
        <img
          alt=""
          aria-hidden="true"
          className="h-5 w-5 object-contain"
          src={imageSrc}
        />
      ) : (
        <span className="material-symbols-outlined text-[1.2rem] text-primary">
          {icon}
        </span>
      )}
      <span className="text-sm font-semibold sm:text-[0.95rem]">
        <FormattedMessage id={labelId} />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        className={className}
        href={href}
        onClick={onClick}
        rel="noreferrer noopener"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {content}
    </button>
  );
};

const AppMenu: React.FC<AppMenuProps> = ({
  currentRoute,
  locale,
  onLocaleChange,
  onNavigate,
}) => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const internalLinks: {
    icon: string;
    labelId: string;
    route: AppRoute;
  }[] = [
    {
      icon: "description",
      labelId: "menu.link.legalnotice",
      route: "/legal-notice",
    },
    {
      icon: "shield_lock",
      labelId: "menu.link.privacyPolicy",
      route: "/privacy-policy",
    },
  ];

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={intl.formatMessage({
          id: isOpen ? "menu.close" : "menu.open",
        })}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface shadow-sm transition-colors hover:cursor-pointer hover:bg-surface-container"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="material-symbols-outlined text-[1.35rem]">
          {isOpen ? "close" : "menu"}
        </span>
      </button>
      {isOpen && (
        <button
          aria-label={intl.formatMessage({ id: "menu.close" })}
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      )}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface-container-lowest shadow-2xl ring-1 ring-black/5">
          <div className="border-b border-outline-variant/40 px-5 py-5">
            <p className="text-[0.7rem] font-headline font-black uppercase tracking-[0.24em] text-secondary">
              <FormattedMessage id="menu.title" />
            </p>
            <div className="mt-4">
              <LocaleSwitcher
                locale={locale}
                onChange={(nextLocale) => {
                  onLocaleChange(nextLocale);
                  setIsOpen(false);
                }}
              />
            </div>
          </div>
          <div className="space-y-1 p-2">
            {internalLinks.map(({ icon, labelId, route }) => (
              <MenuAction
                key={route}
                active={currentRoute === route}
                icon={icon}
                labelId={labelId}
                onClick={() => {
                  onNavigate(route);
                  setIsOpen(false);
                }}
              />
            ))}
            <MenuAction
              href={"https://www.strava.com/clubs/ortsschildsprint"}
              icon="sports_score"
              imageSrc="/img/strava.png"
              labelId="menu.link.strava"
              onClick={() => setIsOpen(false)}
            />
            <MenuAction
              href={"https://github.com/tobiaskeiner/ortsschildsprint"}
              icon="code"
              imageSrc="/img/github.png"
              labelId="menu.link.github"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppMenu;
