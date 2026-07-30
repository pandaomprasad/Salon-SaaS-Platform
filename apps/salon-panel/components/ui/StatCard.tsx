interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  dark?: boolean;
}

export default function StatCard({ label, value, sub, icon, dark }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-5 ${
        dark
          ? "bg-primary text-white"
          : "bg-white border border-border"
      }`}
    >
      {icon && (
        <div className={`mb-3 ${dark ? "text-white/50" : "text-slate"}`}>
          {icon}
        </div>
      )}
      <p className={`text-2xl font-semibold ${dark ? "text-white" : "text-ink"}`}>
        {value}
      </p>
      <p className={`text-[11px] mt-1 ${dark ? "text-white/40" : "text-muted"}`}>
        {label}
      </p>
      {sub && (
        <p className={`text-[11px] mt-0.5 ${dark ? "text-white/30" : "text-muted"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}