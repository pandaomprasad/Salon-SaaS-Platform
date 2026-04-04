import type { AppointmentStatus } from "@/lib/api";

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = "" }: BadgeProps) {
  return (
    <span
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${className}`}
    >
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border border-blue-200",
  IN_PROGRESS: "bg-purple-50 text-purple-700 border border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-red-50 text-red-500 border border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-500 border border-gray-200",
  // lowercase fallback for any old components
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-500";
  const label = status.replace(/_/g, " ").toLowerCase();
  return <Badge label={label} className={style} />;
}