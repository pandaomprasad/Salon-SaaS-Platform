import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-primary text-white hover:bg-charcoal shadow-sm shadow-primary/10",
  secondary: "bg-white border border-border text-ink hover:bg-subtle hover:border-silver transition-colors",
  danger:    "bg-danger/5 text-danger hover:bg-danger/10 border border-danger/20",
  ghost:     "text-slate hover:text-ink hover:bg-subtle",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[12px] rounded-lg gap-1.5",
  md: "px-4 py-2 text-[13px] rounded-lg gap-2",
  lg: "px-5 py-2.5 text-[13px] rounded-lg gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}