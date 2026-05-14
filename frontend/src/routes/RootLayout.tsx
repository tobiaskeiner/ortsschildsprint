import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { use } from "react";
import type { Step } from "../components/Stepper";
import AppHeader from "../components/AppHeader";
import { AppLocaleContext } from "../context/AppLocaleContext";
import { FormattedMessage } from "react-intl";
import { messages } from "../translations";
import {
  HOME_ROUTE,
  WORKFLOW_EDIT_ROUTE,
  WORKFLOW_EXPORT_ROUTE,
  WORKFLOW_ROUTE,
  getWorkflowStepFromPathname,
  isWorkflowRoute,
  normalizePathname,
} from "../utils/routes";

const RootLayout: React.FC = () => {
  const localeContext = use(AppLocaleContext);
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => normalizePathname(state.location.pathname),
  });

  if (!localeContext) return null;

  const workflowStep = getWorkflowStepFromPathname(pathname);
  const showWorkflowChrome = isWorkflowRoute(pathname);

  const navigateTo = (to: string) => {
    void navigate({ to });
    window.scrollTo({ left: 0, top: 0 });
  };

  const steps: Step[] = [
    {
      text: <FormattedMessage id="stepper.upload" />,
      icon: "1",
      onClick: () => navigateTo(WORKFLOW_ROUTE),
      selected: workflowStep === "preview",
    },
    {
      text: <FormattedMessage id="stepper.edit" />,
      icon: "2",
      onClick: () => navigateTo(WORKFLOW_EDIT_ROUTE),
      selected: workflowStep === "edit",
    },
    {
      text: <FormattedMessage id="stepper.export" />,
      icon: "3",
      onClick: () => navigateTo(WORKFLOW_EXPORT_ROUTE),
      selected: workflowStep === "export",
    },
  ];

  const mobileSteps = [
    {
      icon: "upload_file",
      labelId: "stepper.upload",
      route: WORKFLOW_ROUTE,
      step: "preview",
    },
    {
      icon: "location_on",
      labelId: "stepper.edit",
      route: WORKFLOW_EDIT_ROUTE,
      step: "edit",
    },
    {
      icon: "file_download",
      labelId: "stepper.export",
      route: WORKFLOW_EXPORT_ROUTE,
      step: "export",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader
        currentPathname={pathname}
        locale={localeContext.locale}
        onHomeNavigate={() => navigateTo(HOME_ROUTE)}
        onLocaleChange={localeContext.setLocale}
        onNavigate={navigateTo}
        showStepper={showWorkflowChrome}
        steps={steps}
      />
      <main
        className={`mx-auto flex min-h-screen max-w-[1440px] flex-col bg-surface px-3 pt-20 sm:px-5 md:px-8 md:pt-24 ${
          showWorkflowChrome ? "pb-28 md:pb-12" : "pb-10 md:pb-12"
        }`}
      >
        <Outlet />
      </main>
      {showWorkflowChrome && (
        <nav className="fixed inset-x-4 bottom-3 z-50 rounded-[1.5rem] bg-surface-container-lowest/78 px-1.5 py-1.5 shadow-lg backdrop-blur-lg md:hidden">
          <div className="grid grid-cols-3 gap-1.5">
            {mobileSteps.map(({ step, icon, labelId, route }) => {
              const isSelected = workflowStep === step;

              return (
                <button
                  key={labelId}
                  aria-label={messages[localeContext.locale][labelId]}
                  className={`flex items-center justify-center rounded-[1rem] px-3 py-2.5 transition-colors hover:cursor-pointer ${
                    isSelected
                      ? "bg-surface-container-high text-primary"
                      : "text-secondary/80 hover:bg-surface-container-low"
                  }`}
                  onClick={() => navigateTo(route)}
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
  );
};

export default RootLayout;
