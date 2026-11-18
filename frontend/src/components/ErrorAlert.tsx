import { FormattedMessage } from "react-intl";
import type { ReactNode } from "react";

interface ErrorAlertProps {
  description: ReactNode;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  description,
  onDismiss,
}: ErrorAlertProps) => {
  return (
    <div className="fixed left-3 right-3 top-24 z-50 animate-in fade-in slide-in-from-top-4 duration-300 md:left-auto md:right-4 md:top-20 md:max-w-md">
      <div
        className="flex items-start gap-3 rounded-2xl bg-error-container px-4 py-4 text-error shadow-lg sm:px-5"
        role="alert"
      >
        <span className="font-headline text-sm font-bold uppercase tracking-widest text-error">
          <FormattedMessage id="error.title" />
        </span>
        <span className="min-w-0 flex-1 text-sm leading-relaxed">
          {description}
        </span>
        {onDismiss && (
          <button
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:cursor-pointer hover:bg-error/10"
            onClick={onDismiss}
            type="button"
          >
            <span className="sr-only">
              <FormattedMessage id="error.dismiss" />
            </span>
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-xl"
            >
              close
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
