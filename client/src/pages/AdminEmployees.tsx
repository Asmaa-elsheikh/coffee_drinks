import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminEmployees() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const { data: employees, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (newEmployee: any) => {
      const res = await apiRequest("POST", "/api/admin/employees", newEmployee);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Employee added successfully" });
      setIsEditOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const res = await apiRequest("PATCH", `/api/admin/employees/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Employee updated successfully" });
      setIsEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Employee removed successfully" });
    },
  });

  if (!user || user.role !== "admin") {
    if (user && user.role !== "admin") setLocation("/");
    return null;
  }

  const handleSave = () => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: ""
    });
    setIsEditOpen(true);
  };

  const startCreate = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      password: ""
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold flex items-center gap-3">
            <Users className="text-primary" size={32} />
            Employee Management
          </h2>
          <p className="text-muted-foreground">Manage your company employees and their access</p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : employees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  No employees found. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              employees?.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(emp)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive" 
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this employee?")) {
                          deleteMutation.mutate(emp.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {editingEmployee ? "New Password (leave blank to keep current)" : "Password"}
              </Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEmployee ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
