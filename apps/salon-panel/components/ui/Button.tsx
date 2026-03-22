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
  primary:   'bg-ink text-white hover:bg-ink/85 shadow-sm',
  secondary: 'bg-white border border-smoke text-ink hover:border-silver transition-colors',
  danger:    'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100',
  ghost:     'text-ash hover:text-ink hover:bg-smoke',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px] rounded-lg tracking-wide',
  md: 'px-4 py-2.5 text-xs rounded-xl tracking-wide',
  lg: 'px-5 py-3 text-xs rounded-xl tracking-wide',
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
        inline-flex items-center justify-center gap-2 font-medium uppercase
        transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
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