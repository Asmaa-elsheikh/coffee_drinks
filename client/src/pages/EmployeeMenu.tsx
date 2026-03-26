import { useDrinks } from "@/hooks/use-drinks";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { DrinkCard } from "@/components/DrinkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { RotateCcw, XCircle, Coffee } from "lucide-react";

export default function EmployeeMenu() {
  const [location, setLocation] = useLocation();
  const { drinks, isLoading: isLoadingDrinks } = useDrinks();
  const { user } = useAuth();
  const { orders: recentOrders, createOrder, updateStatus, isCreating } = useOrders(
    { userId: String(user?.id) },
    10000
  );
  const isHistoryTab = location === "/history";

  if (!user) {
    setLocation("/login");
    return null;
  }

  // If on history tab, show only history
  if (isHistoryTab) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold">My Order History</h2>
          <p className="text-muted-foreground">Review your past drink requests</p>
        </div>

        <Card className="rounded-2xl overflow-hidden border-border/50">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-accent/20">
            <div className="p-0">
              {(!recentOrders || recentOrders.length === 0) ? (
                <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
              ) : (
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drink Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Sugar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.drink.name}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(order.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>{order.sugar || "None"}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status as any} />
                        </TableCell>
                        <TableCell className="text-center">
                          {order.status === "completed" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm border-0"
                              disabled={isCreating}
                              onClick={() => createOrder({
                                drinkId: order.drinkId,
                                userId: user.id,
                                sugar: order.sugar || "None",
                                notes: order.notes
                              })}
                            >
                              <RotateCcw size={14} />
                              Reorder
                            </Button>
                          )}
                          {order.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateStatus({ id: order.id, status: "cancelled" })}
                            >
                              <XCircle size={14} />
                              Cancel
                            </Button>
                          )}
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

  // Get only the absolute latest order to show status
  const activeOrder = recentOrders?.find(o =>
    ["pending", "accepted", "in_preparation", "ready"].includes(o.status)
  );

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending": return "Sent to kitchen";
      case "accepted": return "Order received by kitchen";
      case "in_preparation": return "Being prepared";
      case "ready": return "Ready for pickup!";
      default: return "";
    }
  };

  // Deduplicate for Superadmins who might see the same drink name across branches
  const uniqueDrinks = (drinks || []).reduce((acc: any[], current: any) => {
    const isDuplicate = acc.find(item => item.name.toLowerCase() === current.name.toLowerCase());
    if (!isDuplicate) acc.push(current);
    return acc;
  }, []);

  // Find the exact "Matcha Latte" if it exists, otherwise any matcha drink, otherwise fallback
  const matchaLatte = uniqueDrinks?.find(d => d.name.toLowerCase() === 'matcha latte');
  const otherMatcha = uniqueDrinks?.find(d => d.name.toLowerCase().includes('matcha') && d.id !== matchaLatte?.id);
  const featuredDrink = matchaLatte || otherMatcha || uniqueDrinks?.[0]; // Best match first
  const menuDrinks = uniqueDrinks; // Show all drinks in the grid including the featured one

  return (
    <div className="space-y-6 md:space-y-12 pb-12">
      {/* Active Order comes first per guidelines */}
      {activeOrder && (
        <section className="animate-enter">
          <div className="glass-card rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-[6px] border-l-accent shadow-xl">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                <Coffee size={32} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="font-display font-bold text-lg md:text-xl">Current Order: {activeOrder.drink.name}</h3>
                  <StatusBadge status={activeOrder.status} />
                </div>
                <p className="text-sm text-primary/80 font-medium">
                  Status: <span className="text-accent font-semibold">{getStatusMessage(activeOrder.status)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ordered at {format(new Date(activeOrder.createdAt), "h:mm a")}
                </p>
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto md:min-w-[150px]">
              {activeOrder.status === "ready" && (
                <Button
                  onClick={() => updateStatus({ id: activeOrder.id, status: "completed" })}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 w-full font-bold h-11 rounded-[0.75rem]"
                  data-testid="button-receive-drink"
                >
                  Receive Order
                </Button>
              )}
              {activeOrder.status === "pending" && (
                <Button
                  onClick={() => updateStatus({ id: activeOrder.id, status: "cancelled" })}
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20 shadow-sm w-full h-11 rounded-[0.75rem]"
                >
                  <XCircle size={16} className="mr-2" />
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hero Featured Section follows Active Order - Alignment Fix */}
      {featuredDrink && (
        <section className="relative rounded-[2.5rem] overflow-hidden group shadow-2xl bg-[#060e20] min-h-[400px] flex items-center">
          <div className="flex flex-col md:flex-row w-full h-full items-center">
            {/* Left Content */}
            <div className="z-20 w-full md:w-1/2 flex flex-col justify-center px-10 lg:px-20 py-10 md:py-0">
              <span className="text-accent font-bold tracking-[0.3em] text-[10px] uppercase mb-4 block">Seasonal Signature</span>
              <h2 className="text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-[1.1]">
                {featuredDrink.name.toLowerCase().includes('matcha') ? featuredDrink.name : "Matcha Latte"}
              </h2>
              <p className="text-primary/80 max-w-lg mb-10 text-base lg:text-lg leading-relaxed font-light">
                {featuredDrink.name.toLowerCase().includes('matcha') 
                  ? featuredDrink.description 
                  : "Experience our premium grade stone-ground matcha, whisked to perfection for a creamy, earthy, and energizing workspace ritual."}
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => createOrder({ drinkId: featuredDrink.id, userId: user.id })}
                  disabled={!featuredDrink.isAvailable || isCreating}
                  className="bg-accent text-accent-foreground px-10 py-4 h-auto rounded-[1rem] font-bold text-sm hover:brightness-110 shadow-lg glow-pulse"
                >
                  Quick Order
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative w-full md:w-1/2 h-[300px] md:h-[450px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#060e20] to-transparent z-10 block md:hidden"></div>
              <img 
                alt="Matcha Latte"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000" 
                src={featuredDrink.name.toLowerCase().includes('matcha') && featuredDrink.imageUrl ? featuredDrink.imageUrl : "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=800"} 
              />
            </div>
          </div>
        </section>
      )}

      {/* Search & Filter Bar equivalent from Stitch */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Morning Selection</h3>
          <p className="text-primary/70 text-base font-light">Curated coffee and tea for the elite workspace.</p>
        </div>
      </section>

      {isLoadingDrinks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[280px] md:h-[300px] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {menuDrinks?.map((drink) => (
            <DrinkCard
              key={drink.id}
              drink={drink}
              isOrdering={isCreating}
              onOrder={(details) => createOrder({
                drinkId: drink.id,
                userId: user.id,
                ...details
              })}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-xl font-display font-bold mb-4">Recent History</h3>
        <Card className="rounded-2xl overflow-hidden border-border/50">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-accent/20">
            {(!recentOrders || recentOrders.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
            ) : (
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Drink Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Sugar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.drink.name}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(order.createdAt), "h:mm a")}
                      </TableCell>
                      <TableCell>{order.sugar || "None"}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status as any} />
                      </TableCell>
                      <TableCell className="text-center">
                        {order.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                            disabled={isCreating}
                            onClick={() => createOrder({
                              drinkId: order.drinkId,
                              userId: user.id,
                              sugar: order.sugar || "None",
                              notes: order.notes
                            })}
                          >
                            <RotateCcw size={14} />
                            Reorder
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
