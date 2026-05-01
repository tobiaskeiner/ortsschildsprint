import type { Formats } from "../../../shared/types";

interface ExportLabelProps {
  label: React.ReactNode;
  subtitle?: React.ReactNode;
  description: React.ReactNode;
  value: Formats;
  checked: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => void;
}

const ExportLabel = (props: ExportLabelProps) => {
  const { description, label, value, checked, subtitle, onChange } = props;

  return (
    <label
      className={`group relative mt-4 flex cursor-pointer items-start gap-4 rounded-[1.5rem] p-4 transition-all sm:p-5 ${
        checked
          ? "bg-surface-container ring-2 ring-primary-container"
          : "bg-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-low"
      }`}
    >
      <input
        className="sr-only peer"
        name="format"
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-secondary transition-all">
        <div
          className={`h-2.5 w-2.5 rounded-full bg-secondary transition-transform ${
            checked ? "scale-100" : "scale-0"
          }`}
        ></div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-headline text-sm font-bold tracking-wide uppercase sm:text-base">
          {label}
        </p>
        {subtitle && (
          <p className="mb-1 font-headline text-[10px] font-bold tracking-[0.14em] text-secondary uppercase sm:text-xs">
            {subtitle}
          </p>
        )}
        <p className="text-xs leading-relaxed text-secondary sm:text-sm">
          {description}
        </p>
      </div>
    </label>
  );
};

export default ExportLabel;
