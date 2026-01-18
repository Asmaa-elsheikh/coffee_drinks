import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Check, X, ChefHat, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function KitchenDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Poll every 5 seconds for new orders
  const { orders, isLoading, updateStatus } = useOrders({ status: "pending,accepted,in_preparation" }, 5000);
  
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (!user || user.role !== "kitchen") {
    // Basic protection, real auth check is on backend
    if (user && user.role !== "kitchen") setLocation("/");
    return null;
  }

  const handleReject = () => {
    if (rejectId) {
      updateStatus({ id: rejectId, status: "rejected", rejectionReason: rejectReason });
      setRejectId(null);
      setRejectReason("");
    }
  };

  // If on history tab, show only history
  if (location === "/kitchen/history") {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Kitchen Order History</h2>
          <p className="text-muted-foreground">Review completed and rejected orders</p>
        </div>
        
        <Card className="rounded-2xl overflow-hidden border-border/50">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="p-0">
              {orders?.filter(o => ["completed", "rejected"].includes(o.status)).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium">{order.drink.name} (for {order.user.name})</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
              {(!orders || orders.filter(o => ["completed", "rejected"].includes(o.status)).length === 0) && (
                <div className="p-8 text-center text-muted-foreground">No history yet.</div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    );
  }

  const pendingOrders = orders?.filter(o => o.status === "pending") || [];
  const activeOrders = orders?.filter(o => ["accepted", "in_preparation"].includes(o.status)) || [];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
            <ChefHat className="text-primary shrink-0" size={32} />
            Kitchen Queue
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage incoming drink orders</p>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Badge variant="secondary" className="text-sm md:text-lg px-3 md:px-4 py-1">
            {pendingOrders.length} New
          </Badge>
          <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 border-primary text-primary">
            {activeOrders.length} Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NEW ORDERS COLUMN */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-sm">
            <AlertCircle size={16} /> Incoming Requests
          </h3>
          
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : pendingOrders.length === 0 ? (
            <div className="h-32 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted-foreground">
              No pending orders
            </div>
          ) : (
            pendingOrders.map(order => (
              <Card key={order.id} className="border-l-4 border-l-yellow-400 shadow-md animate-enter">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-lg">{order.drink.name}</span>
                      <p className="text-sm text-muted-foreground">for {order.user.name}</p>
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {format(new Date(order.createdAt), "h:mm a")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {order.sugar && order.sugar !== "None" && (
                      <Badge variant="secondary">Sugar: {order.sugar}</Badge>
                    )}
                    {order.notes && (
                      <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">
                        Note: {order.notes}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => setRejectId(order.id)}
                  >
                    <X size={16} className="mr-1" /> Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => updateStatus({ id: order.id, status: "accepted" })}
                  >
                    <Check size={16} className="mr-1" /> Accept
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* ACTIVE ORDERS COLUMN */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-sm">
            <Coffee size={16} /> In Progress
          </h3>

          {activeOrders.length === 0 ? (
            <div className="h-32 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted-foreground">
              Kitchen is clear
            </div>
          ) : (
            activeOrders.map(order => (
              <Card key={order.id} className={`shadow-md animate-enter transition-all ${order.status === 'in_preparation' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-lg">{order.drink.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{order.user.name}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(new Date(order.createdAt), "h:mm a")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-2">
                    {order.sugar && order.sugar !== "None" && (
                      <Badge variant="secondary">Sugar: {order.sugar}</Badge>
                    )}
                    {order.notes && (
                      <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">
                        {order.notes}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 justify-end gap-2">
                  {order.status === "accepted" && (
                    <Button 
                      variant="outline"
                      className="w-full border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => updateStatus({ id: order.id, status: "in_preparation" })}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === "in_preparation" && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus({ id: order.id, status: "ready" })}
                    >
                      Mark Ready
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          <Input 
            placeholder="Reason for rejection (e.g. Out of milk)" 
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
