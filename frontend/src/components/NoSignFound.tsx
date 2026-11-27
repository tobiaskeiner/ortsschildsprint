import { FormattedMessage } from "react-intl";

interface NoSignFoundProps {
  onBack: () => void;
  onContinue: () => void;
}

const NoSignFound: React.FC<NoSignFoundProps> = (props) => {
  const { onBack, onContinue } = props;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative z-10 flex max-h-[calc(100%-1.5rem)] w-full max-w-lg flex-col items-center overflow-y-auto rounded-[1.75rem] bg-surface-container-lowest/95 p-6 text-center shadow-2xl backdrop-blur-2xl sm:p-8 md:p-12">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-highest sm:mb-8 sm:h-24 sm:w-24">
          <span
            className="material-symbols-outlined text-on-surface-variant opacity-50"
            style={{ fontSize: "40px" }}
            data-icon="location_off"
          >
            location_off
          </span>

          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container shadow-lg">
            <span
              className="material-symbols-outlined text-on-primary-container font-bold"
              style={{ fontSize: "18px" }}
              data-icon="priority_high"
            >
              priority_high
            </span>
          </div>
        </div>

        <h1 className="mb-4 font-headline text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          <FormattedMessage id="edit.noSigns.title" />
        </h1>

        <p className="mb-8 max-w-md text-sm leading-relaxed text-on-surface-variant sm:mb-10 sm:text-base">
          <FormattedMessage id="edit.noSigns.description" />
        </p>

        <div className="flex w-full flex-col gap-4">
          <button
            onClick={onBack}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container px-8 py-3.5 font-headline font-bold uppercase tracking-[0.05em] text-on-primary-container transition-transform duration-200 hover:scale-[1.02] sm:py-4"
          >
            <span className="material-symbols-outlined" data-icon="upload">
              upload
            </span>
            <FormattedMessage id="edit.noSigns.back" />
          </button>
          <button
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-highest px-8 py-3.5 font-headline font-bold uppercase tracking-[0.05em] text-on-surface transition-all duration-200 hover:scale-[1.02] hover:bg-surface-container-high sm:py-4"
          >
            <span
              className="material-symbols-outlined"
              data-icon="arrow_forward"
            >
              arrow_forward
            </span>
            <FormattedMessage id="edit.noSigns.continue" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoSignFound;
