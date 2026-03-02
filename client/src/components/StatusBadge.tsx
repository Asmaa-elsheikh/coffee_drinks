import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Coffee, Check, AlertCircle } from "lucide-react";

type OrderStatus = "pending" | "accepted" | "in_preparation" | "ready" | "completed" | "rejected" | "cancelled";

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Check },
    in_preparation: { label: "Brewing", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Coffee },
    ready: { label: "Ready to Pickup", color: "bg-green-100 text-green-800 border-green-200 animate-pulse", icon: CheckCircle2 },
    completed: { label: "Completed", color: "bg-gray-100 text-gray-800 border-gray-200", icon: CheckCircle2 },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200 line-through opacity-70", icon: XCircle },
  };

  const { label, color, icon: Icon } = config[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: AlertCircle };

  return (
    <Badge variant="outline" className={`${color} px-3 py-1 rounded-full gap-1.5 border`}>
      <Icon size={14} />
      {label}
    </Badge>
  );
}
