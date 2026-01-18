import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertOrder } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useDrinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drinks, isLoading } = useQuery({
    queryKey: [api.drinks.list.path],
    queryFn: async () => {
      const res = await fetch(api.drinks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch drinks");
      return api.drinks.list.responses[200].parse(await res.json());
    },
  });

  const createDrinkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof api.drinks.create.input>) => {
      const validated = api.drinks.create.input.parse(data);
      const res = await fetch(api.drinks.create.path, {
        method: api.drinks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create drink");
      return api.drinks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.drinks.list.path] });
      toast({ title: "Success", description: "Drink added to menu" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add drink", variant: "destructive" }),
  });

  const deleteDrinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.drinks.delete.path, { id });
      const res = await fetch(url, { method: api.drinks.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete drink");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.drinks.list.path] });
      toast({ title: "Success", description: "Drink removed" });
    },
  });

  const updateDrinkMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & z.infer<typeof api.drinks.update.input>) => {
      const url = buildUrl(api.drinks.update.path, { id });
      const res = await fetch(url, {
        method: api.drinks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update drink");
      return api.drinks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.drinks.list.path] });
      toast({ title: "Success", description: "Drink updated" });
    },
  });

  return {
    drinks,
    isLoading,
    createDrink: createDrinkMutation.mutate,
    deleteDrink: deleteDrinkMutation.mutate,
    updateDrink: updateDrinkMutation.mutate,
    isCreating: createDrinkMutation.isPending,
  };
}
