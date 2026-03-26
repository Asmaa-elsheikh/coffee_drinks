import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Coffee, Check, AlertCircle } from "lucide-react";

type OrderStatus = "pending" | "accepted" | "in_preparation" | "ready" | "completed" | "rejected" | "cancelled";

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: "PENDING", color: "bg-muted text-muted-foreground border-transparent", icon: Clock },
    accepted: { label: "ACCEPTED", color: "bg-primary/20 text-primary border-transparent", icon: Check },
    in_preparation: { label: "BREWING", color: "bg-secondary text-secondary-foreground border-transparent", icon: Coffee },
    ready: { label: "READY", color: "bg-accent/20 text-accent border-accent/20 glow-pulse", icon: CheckCircle2 },
    completed: { label: "COMPLETED", color: "bg-muted/50 text-muted-foreground border-transparent", icon: CheckCircle2 },
    rejected: { label: "REJECTED", color: "bg-destructive/20 text-destructive border-transparent", icon: XCircle },
    cancelled: { label: "CANCELLED", color: "bg-muted/50 text-muted-foreground border-transparent line-through opacity-70", icon: XCircle },
  };

  const { label, color, icon: Icon } = config[status] || { label: status.toUpperCase(), color: "bg-muted text-muted-foreground", icon: AlertCircle };

  return (
    <Badge variant="outline" className={`${color} px-3 py-1 rounded-full gap-1.5 uppercase text-[10px] tracking-wider font-bold border`}>
      <Icon size={12} />
      {label}
    </Badge>
  );
}
