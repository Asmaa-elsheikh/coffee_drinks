import { Drink } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Clock, Plus, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DrinkCardProps {
  drink: Drink;
  onOrder: (details: { sugar?: string; notes?: string }) => void;
  isOrdering: boolean;
}

export function DrinkCard({ drink, onOrder, isOrdering }: DrinkCardProps) {
  const [open, setOpen] = useState(false);
  const [sugar, setSugar] = useState("None");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    onOrder({ sugar, notes });
    setOpen(false);
    setSugar("None");
    setNotes("");
  };

  return (
    <>
      <div className="group bg-card hover-scale rounded-[1rem] overflow-hidden flex flex-col h-full shadow-md">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center text-muted-foreground/30">
          {drink.imageUrl ? (
            <img
              src={drink.imageUrl}
              alt={drink.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show the parent's icon by setting a state or using a CSS-only approach
                // Since we can't easily add state here without more changes, 
                // we'll just ensure the <img> is hidden and the fallback is correctly positioned.
              }}
            />
          ) : (
            <Coffee size={64} strokeWidth={1} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white font-medium">{drink.category}</span>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-display font-bold text-lg leading-tight">{drink.name}</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
            {drink.description || "A delicious choice for your break."}
          </p>

          <Button
            onClick={() => setOpen(true)}
            disabled={!drink.isAvailable || isOrdering}
            className={`w-full gap-2 ${!drink.isAvailable ? 'opacity-50' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}
          >
            {drink.isAvailable ? (
              <>
                <Plus size={18} />
                Order Now
              </>
            ) : (
              "Currently Unavailable"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] glass-card border-none rounded-[1.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Customize {drink.name}</DialogTitle>
            <DialogDescription>
              Adjust your drink to your taste.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sugar">Sugar Level</Label>
              <Select value={sugar} onValueChange={setSugar}>
                <SelectTrigger id="sugar" className="rounded-full bg-background border-none shadow-sm">
                  <SelectValue placeholder="Select sugar level" />
                </SelectTrigger>
                <SelectContent className="glass-card border-none rounded-[1rem]">
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="1 Spoon">1 Spoon</SelectItem>
                  <SelectItem value="2 Spoons">2 Spoons</SelectItem>
                  <SelectItem value="Extra Sweet">Extra Sweet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Requests</Label>
              <Textarea
                id="notes"
                placeholder="E.g. Extra hot, oat milk..."
                className="rounded-[1rem] resize-none bg-background border-none shadow-sm min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full border-none hover:bg-white/10">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
