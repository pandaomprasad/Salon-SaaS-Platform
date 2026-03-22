import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  danger:    'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  ghost:     'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px] rounded-lg',
  md: 'px-4 py-2.5 text-xs rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        tracking-wide transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}