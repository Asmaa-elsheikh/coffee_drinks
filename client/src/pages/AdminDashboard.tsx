import { useAnalytics } from "@/hooks/use-analytics";
import { useDrinks } from "@/hooks/use-drinks";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Trash2, Edit2, TrendingUp, Users, Coffee } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { data: analytics, isLoading: isLoadingAnalytics } = useAnalytics();
  const { drinks, createDrink, updateDrink, deleteDrink } = useDrinks();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Coffee",
    description: "",
    preparationTime: "5",
    isAvailable: true
  });

  if (!user || user.role !== "admin") {
    if (user && user.role !== "admin") setLocation("/");
    return null;
  }

  const handleSave = () => {
    const payload = {
      ...formData,
      preparationTime: parseInt(formData.preparationTime) || 5
    };
    
    if (editingDrink) {
      updateDrink({ id: editingDrink.id, ...payload });
    } else {
      createDrink(payload);
    }
    setIsEditOpen(false);
    setEditingDrink(null);
    setFormData({
      name: "",
      category: "Coffee",
      description: "",
      preparationTime: "5",
      isAvailable: true
    });
  };

  const startEdit = (drink: any) => {
    setEditingDrink(drink);
    setFormData({
      name: drink.name,
      category: drink.category,
      description: drink.description || "",
      preparationTime: String(drink.preparationTime),
      isAvailable: drink.isAvailable
    });
    setIsEditOpen(true);
  };

  const startCreate = () => {
    setEditingDrink(null);
    setFormData({
      name: "",
      category: "Coffee",
      description: "",
      preparationTime: "5",
      isAvailable: true
    });
    setIsEditOpen(true);
  };

  // Prepare chart data
  const chartData = analytics?.popularDrinks.slice(0, 5) || [];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of system performance and menu management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Menu Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drinks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.ordersByStatus?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Drinks Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top 5 Popular Drinks</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Menu Management */}
        <Card className="col-span-1 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Menu Management</CardTitle>
            <Button onClick={startCreate} size="sm" className="gap-2">
              <Plus size={16} /> Add Drink
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drinks?.map((drink) => (
                    <TableRow key={drink.id}>
                      <TableCell className="font-medium">
                        {drink.name}
                        {!drink.isAvailable && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Unavailable</span>
                        )}
                      </TableCell>
                      <TableCell>{drink.category}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(drink)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteDrink(drink.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDrink ? "Edit Drink" : "Add New Drink"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prepTime">Preparation Time (mins)</Label>
              <Input 
                id="prepTime" 
                type="number"
                value={formData.preparationTime} 
                onChange={(e) => setFormData({...formData, preparationTime: e.target.value})} 
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="available" 
                checked={formData.isAvailable}
                onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="available">Available for ordering</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingDrink ? "Save Changes" : "Create Drink"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
