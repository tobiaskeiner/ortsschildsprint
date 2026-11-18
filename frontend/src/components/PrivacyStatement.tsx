import { FormattedMessage } from "react-intl";

const PrivacyStatement: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-primary-container/8 p-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:p-5">
      <p className="flex shrink-0 items-center gap-2 font-headline text-xs font-black uppercase tracking-widest text-on-surface">
        <span
          className="material-symbols-outlined text-primary"
          data-icon="shield_lock"
        >
          shield_lock
        </span>
        <FormattedMessage id="privacy.title" />
      </p>
      <p className="max-w-2xl text-xs font-medium leading-relaxed text-secondary sm:text-sm">
        <FormattedMessage id="privacy.description" />
      </p>
    </div>
  );
};

export default PrivacyStatement;
