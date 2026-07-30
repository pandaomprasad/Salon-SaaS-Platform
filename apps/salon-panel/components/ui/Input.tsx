interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export function Input({ label, icon, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-slate">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full border border-border rounded-lg py-2 text-[13px] bg-white
            focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all
            placeholder:text-muted/60
            ${icon ? "pl-9 pr-3" : "px-3"}
            ${error ? "border-danger focus:ring-danger/20 focus:border-danger" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-slate">
          {label}
        </label>
      )}
      <select
        className={`
          w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-white
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all
          ${error ? "border-danger" : ""}
          ${className}
        `}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-slate">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full border border-border rounded-lg px-3 py-2 text-[13px] bg-white
          focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none
          placeholder:text-muted/60
          ${error ? "border-danger" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}