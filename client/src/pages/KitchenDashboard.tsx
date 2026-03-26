import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Check, X, ChefHat, Clock, AlertCircle, Coffee, ClipboardList, Timer, Zap, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function KitchenDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  // Use different filters for history vs queue
  const isHistoryPage = location.startsWith("/kitchen/history");
  const { orders, isLoading, updateStatus } = useOrders(
    { status: isHistoryPage ? "completed,rejected,ready,cancelled" : "pending,accepted,in_preparation,completed" },
    5000
  );

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
  if (isHistoryPage) {
    return (
      <div className="space-y-8 animate-enter">
        <div>
          <h2 className="text-3xl font-display font-bold text-accent">Kitchen Order History</h2>
          <p className="text-muted-foreground font-light">Review completed and rejected orders across the workspace.</p>
        </div>

        <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl glass-card">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-accent/20">
            <div className="p-0">
              {(!orders || orders.length === 0) ? (
                <div className="p-12 text-center text-muted-foreground">
                  <ClipboardList className="mx-auto mb-4 opacity-20" size={48} />
                  <p>No history records found.</p>
                </div>
              ) : (
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="border-border/10 hover:bg-transparent">
                      <TableHead className="text-accent/70 font-display font-bold uppercase tracking-wider text-xs px-8 h-16">Drink Name</TableHead>
                      <TableHead className="text-accent/70 font-display font-bold uppercase tracking-wider text-xs h-16">Customer</TableHead>
                      <TableHead className="text-accent/70 font-display font-bold uppercase tracking-wider text-xs h-16">Date</TableHead>
                      <TableHead className="text-accent/70 font-display font-bold uppercase tracking-wider text-xs h-16 pr-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="border-border/5 group hover:bg-white/5 transition-colors">
                        <TableCell className="font-bold py-8 px-8 text-lg">
                          {order.drink.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {order.user.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(order.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="pr-8">
                          <StatusBadge status={order.status as any} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const pendingOrders = orders?.filter(o => o.status === "pending") || [];
  const activeOrders = orders?.filter(o => ["accepted", "in_preparation"].includes(o.status)) || [];
  const completedToday = orders?.filter(o => {
    if (o.status !== "completed") return false;
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.getDate() === today.getDate() &&
           orderDate.getMonth() === today.getMonth() &&
           orderDate.getFullYear() === today.getFullYear();
  }) || [];

  return (
    <div className="space-y-8 md:space-y-12 pb-12">
      {/* Stats Header mimicking Emerald Kitchen */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 animate-enter">
        <div className="bg-muted/40 rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-center border border-border/10 shadow-sm">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] mb-2 opacity-80">Total Orders Today</p>
          <h3 className="text-5xl font-display font-black text-accent">{completedToday.length}</h3>
          <CheckCircle2 className="absolute -right-4 -bottom-4 opacity-10 scale-[3] text-accent pointer-events-none" />
        </div>
        <div className="bg-muted/40 rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-center border border-border/10 shadow-sm border-b-4 border-b-yellow-500/50">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] mb-2 opacity-80">Total Pending</p>
          <h3 className="text-5xl font-display font-black text-foreground">{pendingOrders.length}</h3>
          <AlertCircle className="absolute -right-4 -bottom-4 opacity-5 scale-[3] pointer-events-none" />
        </div>
        <div className="bg-muted/40 rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-center border border-accent/20 shadow-sm border-b-4">
          <p className="text-accent/80 text-[10px] font-black uppercase tracking-[0.25em] mb-2">Active Now</p>
          <h3 className="text-5xl font-display font-black text-accent">{activeOrders.length}</h3>
          <Zap className="absolute -right-4 -bottom-4 opacity-10 scale-[3] text-accent pointer-events-none" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Column 1: Incoming Requests */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-display font-black flex items-center gap-4">
              Incoming Requests
              <span className="bg-accent/10 text-accent text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-accent/20">
                {pendingOrders.length} NEW
              </span>
            </h2>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />)
            ) : pendingOrders.length === 0 ? (
              <div className="h-64 border-[3px] border-dashed border-border/10 rounded-[3rem] flex items-center justify-center text-muted-foreground font-light text-xl italic bg-muted/5">
                No pending orders
              </div>
            ) : (
              pendingOrders.map(order => (
                <Card key={order.id} className="glass-card rounded-[2.5rem] p-8 group hover:bg-muted/30 transition-all duration-500 border-border/10 animate-enter overflow-hidden relative shadow-2xl">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-[80px] h-[80px] rounded-[1.5rem] bg-muted/50 flex items-center justify-center overflow-hidden shadow-2xl border border-white/5 ring-1 ring-white/10 group-hover:ring-accent/40 transition-all duration-500">
                        {order.drink.imageUrl ? (
                          <img src={order.drink.imageUrl} alt={order.drink.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        ) : (
                          <Coffee className="text-accent w-8 h-8 opacity-60" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-2xl font-display font-black text-foreground mb-1 tracking-tight">{order.drink.name}</h4>
                        <p className="text-base text-primary/70 font-medium">Customer: <span className="text-foreground">{order.user.name}</span></p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest bg-muted/80 px-4 py-2 rounded-full text-muted-foreground border border-white/5 shadow-inner">
                      {format(new Date(order.createdAt), "h:mm a")}
                    </span>
                  </div>

                  <div className="bg-background/40 rounded-[1.5rem] p-5 mb-8 border-l-[6px] border-accent/60 shadow-inner">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-3">Specifications</p>
                    <div className="flex flex-wrap gap-3">
                       {order.sugar && order.sugar !== "None" && (
                        <span className="text-[12px] font-bold bg-muted/60 px-3 py-1.5 rounded-xl border border-white/5">Sugar: {order.sugar}</span>
                      )}
                      {order.notes ? (
                        <span className="text-[12px] font-bold bg-accent/10 text-accent px-3 py-1.5 rounded-xl border border-accent/20">Note: {order.notes}</span>
                      ) : (
                        <span className="text-[12px] font-bold text-muted-foreground/40 italic px-3 py-1.5">No special requests</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => updateStatus({ id: order.id, status: "accepted" })}
                      className="flex-[2] bg-accent text-accent-foreground font-black py-8 rounded-full hover:shadow-[0_0_40px_rgba(78,222,163,0.4)] transition-all active:scale-95 text-xs uppercase tracking-[0.25em] border-none shadow-xl"
                    >
                      Accept Order
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectId(order.id)}
                      className="flex-1 border-white/10 text-destructive hover:bg-destructive/10 hover:text-destructive py-8 rounded-full transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest bg-white/5"
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Column 2: In Progress */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-display font-black flex items-center gap-4">
              In Progress
              <span className="bg-primary/20 text-primary text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-primary/20">
                {activeOrders.length} ACTIVE
              </span>
            </h2>
          </div>

          <div className="space-y-6">
            {activeOrders.length === 0 ? (
              <div className="h-64 border-[3px] border-dashed border-border/10 rounded-[3rem] flex items-center justify-center text-muted-foreground font-light text-xl italic bg-muted/5">
                Kitchen is clear
              </div>
            ) : (
              activeOrders.map(order => (
                <Card key={order.id} className="bg-muted/10 rounded-[3rem] p-10 border-l-[10px] border-accent shadow-2xl relative overflow-hidden group animate-enter ring-1 ring-white/5">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-[80px] h-[80px] bg-muted/40 rounded-[2rem] flex items-center justify-center border border-white/5 shadow-2xl ring-1 ring-white/10">
                        <ChefHat className="text-primary size={40} opacity-80" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-display font-black text-foreground tracking-tight">{order.drink.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-base text-primary/70 font-semibold">{order.user.name}</p>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-1.5">Queue Reference</p>
                      <span className="text-lg font-mono text-muted-foreground font-bold">#ORD-{order.id}</span>
                    </div>
                  </div>

                  <div className="mb-10">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 mb-4">
                      <span>PREP PROGRESS</span>
                      <span className="text-accent">{order.status === 'in_preparation' ? '75%' : '25%'}</span>
                    </div>
                    <div className="w-full bg-background/50 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className="bg-accent h-full rounded-full shadow-[0_0_20px_rgba(78,222,163,0.6)] transition-all duration-[1500ms] cubic-bezier(0.65, 0, 0.35, 1)" 
                        style={{ width: order.status === 'in_preparation' ? '75%' : '25%' }}
                      ></div>
                    </div>
                  </div>

                  <Button
                    className={`w-full font-black py-10 rounded-full transition-all active:scale-95 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.25em] shadow-2xl border-none ${
                        order.status === "accepted" 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-accent text-accent-foreground hover:brightness-110 shadow-[0_0_30px_rgba(78,222,163,0.3)] glow-pulse"
                    }`}
                    onClick={() => updateStatus({ id: order.id, status: order.status === 'accepted' ? 'in_preparation' : 'ready' })}
                  >
                    {order.status === "accepted" ? (
                      <>Start Preparing</>
                    ) : (
                      <><CheckCircle2 size={24} className="stroke-[3px]" /> Mark Ready</>
                    )}
                  </Button>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="rounded-[3rem] p-12 glass-card border-white/10 max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-display font-black text-foreground tracking-tight">Reject Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <p className="text-primary/70 font-light leading-relaxed text-lg">Please provide a brief reason for the rejection. This helps the customer understand why their request couldn't be fulfilled at this time.</p>
            <Input
              placeholder="e.g. Premium Matcha out of stock"
              value={rejectReason}
              className="bg-background/40 border-white/10 h-16 rounded-[1.5rem] px-8 text-lg font-medium shadow-inner focus:ring-accent"
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-12 gap-6 sm:justify-end">
            <Button variant="ghost" className="rounded-full px-10 py-8 h-auto font-bold uppercase tracking-widest text-xs opacity-60 hover:opacity-100 transition-opacity" onClick={() => setRejectId(null)}>Dismiss</Button>
            <Button variant="destructive" className="rounded-full px-12 py-8 h-auto font-black uppercase tracking-widest text-xs border-none shadow-xl" onClick={handleReject}>Revoke Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
