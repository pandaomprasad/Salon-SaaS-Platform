interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  dark?: boolean
}

export default function StatCard({ label, value, sub, icon, dark = false }: StatCardProps) {
  return (
    <div className={`
      rounded-2xl p-6
      ${dark
        ? 'bg-ink text-white shadow-[0_4px_24px_rgba(0,0,0,0.18)]'
        : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
      }
    `}>
      <div className="flex items-start justify-between mb-6">
        <p className={`text-[9px] font-semibold tracking-[0.2em] uppercase ${dark ? 'text-silver/60' : 'text-ash/70'}`}>
          {label}
        </p>
        {icon && (
          <span className={dark ? 'text-gold' : 'text-silver'}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-[2.6rem] font-display font-light leading-none mb-2 ${dark ? 'text-white' : 'text-ink'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-[11px] mt-2 ${dark ? 'text-silver/50' : 'text-ash/70'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}