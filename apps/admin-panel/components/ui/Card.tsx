interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)]
        ${onClick
          ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-200'
          : ''
        }
        ${className}
      `}
    >
      {children}
    </div>
  )
}