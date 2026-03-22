interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  dark?: boolean
}

export default function StatCard({
  label, value, sub, icon, trend, dark = false,
}: StatCardProps) {
  return (
    <div className={`
      rounded-2xl p-5
      ${dark
        ? 'bg-blue-600 text-white shadow-[0_4px_24px_rgba(37,99,235,0.3)]'
        : 'bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)]'
      }
    `}>
      <div className="flex items-start justify-between mb-4">
        <p className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${dark ? 'text-blue-200' : 'text-slate-400'}`}>
          {label}
        </p>
        {icon && (
          <span className={dark ? 'text-blue-200' : 'text-slate-400'}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-3xl font-semibold mb-1.5 tracking-tight ${dark ? 'text-white' : 'text-slate-800'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-[11px] ${dark ? 'text-blue-200' : 'text-slate-400'}`}>
          {trend === 'up'   && <span className="text-emerald-400 mr-1">↑</span>}
          {trend === 'down' && <span className="text-red-400 mr-1">↓</span>}
          {sub}
        </p>
      )}
    </div>
  )
}