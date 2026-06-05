import { Badge } from "@/components/ui/badge";

type Status = "active" | "expiring_soon" | "expired" | "pending";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-800 border-green-200" },
  expiring_soon: { label: "Expiring Soon", className: "bg-amber-100 text-amber-800 border-amber-200" },
  expired: { label: "Expired", className: "bg-red-100 text-red-800 border-red-200" },
  pending: { label: "Pending", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as Status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <Badge variant="outline" className={`font-medium ${config.className}`} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}
