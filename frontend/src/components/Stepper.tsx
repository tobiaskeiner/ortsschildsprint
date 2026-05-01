export interface Step {
  icon: string;
  text: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface StepperProps {
  steps: Step[];
}

const iconSelected =
  "flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-xs font-headline font-black text-primary shadow-sm transition-transform group-hover:scale-110 md:h-8 md:w-8 md:bg-primary-container md:text-on-primary-container md:shadow-md md:text-sm";
const iconNotSelected =
  "flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest text-xs font-headline font-black text-secondary transition-transform group-hover:scale-110 md:h-8 md:w-8 md:text-sm";

const Stepper: React.FC<StepperProps> = ({ steps }) => {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-4 px-1 md:px-0">
        {steps.flatMap(({ icon, selected, text, onClick, disabled }, idx) => {
          const step = (
            <button
              key={icon}
              className="group flex items-center gap-2 whitespace-nowrap rounded-full px-1 py-1 hover:cursor-pointer md:gap-3"
              onClick={() => {
                if (!disabled) onClick();
              }}
              type="button"
            >
              <span className={selected ? iconSelected : iconNotSelected}>
                {icon}
              </span>
              <span
                className={
                  selected
                    ? "text-[10px] font-headline font-black uppercase tracking-[0.18em] text-primary sm:text-xs md:text-on-surface md:underline md:underline-offset-4"
                    : "text-[10px] font-headline font-bold uppercase tracking-[0.18em] text-secondary sm:text-xs"
                }
              >
                {text}
              </span>
            </button>
          );

          if (idx < steps.length - 1) {
            return [
              step,
              <div
                key={`divider-${icon}`}
                className="h-px w-6 shrink-0 bg-surface-container-highest md:w-12"
              />,
            ];
          }

          return [step];
        })}
      </div>
    </div>
  );
};

export default Stepper;
