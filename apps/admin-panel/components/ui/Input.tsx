interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export function Input({ label, icon, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full border border-slate-200 rounded-xl py-2.5 text-sm bg-white
            focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
            transition-all placeholder:text-slate-300
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
        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={`
          w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white
          focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
          transition-all
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
        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white
          focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
          transition-all resize-none placeholder:text-slate-300
          ${error ? 'border-red-300' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}