import { FormattedMessage } from "react-intl";

const PrivacyStatement: React.FC = () => {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary-container/8 px-4 py-3.5 sm:gap-4 sm:px-5">
      <span
        className="material-symbols-outlined shrink-0 text-primary"
        data-icon="shield_lock"
      >
        shield_lock
      </span>
      <p className="text-xs font-medium leading-relaxed text-secondary sm:text-sm">
        <FormattedMessage id="privacy.description" />
      </p>
    </div>
  );
};

export default PrivacyStatement;
