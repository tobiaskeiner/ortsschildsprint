import { FormattedMessage } from "react-intl";

const PrivacyStatement: React.FC = () => {
  return (
    <div className="flex flex-row gap-3 rounded-2xl bg-primary-container/8 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
      <span
        className="material-symbols-outlined mt-0.5 text-primary"
        data-icon="shield_lock"
      >
        shield_lock
      </span>
      <div>
        <p className="mb-1 font-headline text-xs font-black uppercase tracking-widest text-on-surface">
          <FormattedMessage id="privacy.title" />
        </p>
        <p className="text-xs font-medium leading-relaxed text-secondary sm:text-sm">
          <FormattedMessage id="privacy.description" />
        </p>
      </div>
    </div>
  );
};

export default PrivacyStatement;
