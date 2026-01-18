import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type OrderStatus = "pending" | "accepted" | "in_preparation" | "ready" | "completed" | "rejected";

export function useOrders(filters?: { status?: string, userId?: string }, pollInterval = 0) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: [api.orders.list.path, filters],
    queryFn: async () => {
      // Build query string manually since URLSearchParams handles optional params well
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.userId) params.append("userId", filters.userId);
      
      const url = `${api.orders.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.list.responses[200].parse(await res.json());
    },
    refetchInterval: pollInterval,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const validated = api.orders.create.input.parse(data);
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to place order");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({ title: "Order Placed!", description: "The kitchen has received your request." });
    },
    onError: () => toast({ title: "Error", description: "Could not place order.", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number, status: OrderStatus, rejectionReason?: string }) => {
      const url = buildUrl(api.orders.updateStatus.path, { id });
      const payload = { status, rejectionReason };
      const validated = api.orders.updateStatus.input.parse(payload);
      
      const res = await fetch(url, {
        method: api.orders.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.orders.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      const messages: Record<string, string> = {
        accepted: "Order accepted",
        in_preparation: "Started preparing",
        ready: "Order marked ready",
        completed: "Order completed",
        rejected: "Order rejected"
      };
      toast({ title: "Status Updated", description: messages[variables.status] || "Status changed" });
    },
  });

  return {
    orders,
    isLoading,
    createOrder: createOrderMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isCreating: createOrderMutation.isPending,
  };
}
