interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export function Input({ label, icon, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-ash">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full border border-smoke rounded-xl py-2.5 text-sm bg-white
            focus:outline-none focus:border-silver transition-colors
            placeholder:text-silver/70
            ${icon ? 'pl-9 pr-4' : 'px-4'}
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-ash">
          {label}
        </label>
      )}
      <select
        className={`
          w-full border border-smoke rounded-xl px-4 py-2.5 text-sm bg-white
          focus:outline-none focus:border-silver transition-colors
          ${error ? 'border-red-300' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-medium tracking-[0.1em] uppercase text-ash">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full border border-smoke rounded-xl px-4 py-2.5 text-sm bg-white
          focus:outline-none focus:border-silver transition-colors resize-none
          placeholder:text-silver/70
          ${error ? 'border-red-300' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}