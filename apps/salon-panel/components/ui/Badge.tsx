import type { AppointmentStatus } from "@/lib/api";

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className = "" }: BadgeProps) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md capitalize ${className}`}>
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:     "bg-warning/10 text-warning",
  CONFIRMED:   "bg-blue-50 text-blue-600",
  IN_PROGRESS: "bg-accent/10 text-accent",
  COMPLETED:   "bg-success/10 text-success",
  CANCELLED:   "bg-danger/10 text-danger",
  NO_SHOW:     "bg-subtle text-muted",
  pending:     "bg-warning/10 text-warning",
  confirmed:   "bg-blue-50 text-blue-600",
  completed:   "bg-success/10 text-success",
  cancelled:   "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-subtle text-muted";
  const label = status.replace(/_/g, " ").toLowerCase();
  return <Badge label={label} className={style} />;
}