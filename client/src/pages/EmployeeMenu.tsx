import { useDrinks } from "@/hooks/use-drinks";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { DrinkCard } from "@/components/DrinkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";

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
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="p-0">
              {recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium">{order.drink.name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {order.sugar && order.sugar !== "None" && (
                      <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground hidden sm:inline-block">
                        {order.sugar}
                      </span>
                    )}
                    <StatusBadge status={order.status as any} />
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
              )}
            </div>
          </ScrollArea>
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

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold">Drink Menu</h2>
          <p className="text-sm md:text-base text-muted-foreground">What would you like today, {user.name}?</p>
        </div>
      </div>

      {activeOrder && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-enter shadow-sm">
          <div className="w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h3 className="font-semibold text-lg truncate max-w-[200px]">Current Order: {activeOrder.drink.name}</h3>
              <StatusBadge status={activeOrder.status} />
            </div>
            <p className="text-sm font-medium text-primary mt-1">
              {getStatusMessage(activeOrder.status)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ordered at {format(new Date(activeOrder.createdAt), "h:mm a")}
            </p>
          </div>
          {activeOrder.status === "ready" && (
            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => updateStatus({ id: activeOrder.id, status: "completed" })}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full sm:w-auto"
                data-testid="button-receive-drink"
              >
                Noted, receiving now
              </Button>
              <p className="text-[10px] md:text-xs text-muted-foreground">Don't let it get cold.</p>
            </div>
          )}
        </div>
      )}

      {isLoadingDrinks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[280px] md:h-[300px] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {drinks?.map((drink) => (
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
          <ScrollArea className="h-[300px]">
            <div className="p-0">
              {recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium">{order.drink.name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {order.sugar && order.sugar !== "None" && (
                      <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground hidden sm:inline-block">
                        {order.sugar}
                      </span>
                    )}
                    <StatusBadge status={order.status as any} />
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
