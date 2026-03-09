import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Users, Loader2, ShieldCheck, Soup, User as UserIcon, MapPin } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "employee",
        branchId: "",
        assignedKitchenId: ""
    });

    const { data: usersList, isLoading } = useQuery<any[]>({
        queryKey: ["/api/admin/users"],
    });

    const { data: branches } = useQuery<any[]>({
        queryKey: ["/api/branches"],
        enabled: !!user
    });

    const kitchens = (usersList || []).filter(u => u.role === "kitchen" && (!formData.branchId || u.branchId?.toString() === formData.branchId.toString()));

    const createMutation = useMutation({
        mutationFn: async (newUser: any) => {
            const res = await apiRequest("POST", "/api/admin/users", newUser);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "User created successfully" });
            setIsEditOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create user",
                variant: "destructive"
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: any) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${id}`, updates);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "User updated successfully" });
            setIsEditOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update user",
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/admin/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "User removed successfully" });
        },
    });

    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
        if (user && user.role !== "admin" && user.role !== "superadmin") setLocation("/");
        return null;
    }

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            toast({ title: "Please fill in all required fields", variant: "destructive" });
            return;
        }
        if (user.role === "superadmin" && !formData.branchId && formData.role !== 'superadmin') {
            toast({ title: "Please select a branch", variant: "destructive" });
            return;
        }

        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, ...formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const startEdit = (u: any) => {
        setEditingUser(u);
        setFormData({
            name: u.name,
            email: u.email,
            password: "",
            role: u.role,
            branchId: u.branchId?.toString() || "",
            assignedKitchenId: u.assignedKitchenId?.toString() || ""
        });
        setIsEditOpen(true);
    };

    const startCreate = () => {
        setEditingUser(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "employee",
            branchId: user.role === "superadmin" ? "" : (user.branchId?.toString() || ""),
            assignedKitchenId: ""
        });
        setIsEditOpen(true);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'superadmin':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 uppercase text-[10px] tracking-wider"><ShieldCheck className="w-3 h-3 mr-1" /> Super Admin</Badge>;
            case 'admin':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 uppercase text-[10px] tracking-wider"><ShieldCheck className="w-3 h-3 mr-1" /> Branch Admin</Badge>;
            case 'kitchen':
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 uppercase text-[10px] tracking-wider"><Soup className="w-3 h-3 mr-1" /> Kitchen</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 uppercase text-[10px] tracking-wider"><UserIcon className="w-3 h-3 mr-1" /> Employee</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                        <Users className="text-primary" size={32} />
                        User Management
                    </h2>
                    <p className="text-muted-foreground">Manage roles, branches, and fulfillment assignments</p>
                </div>
                <div className="flex gap-2">
                    {user.role === "superadmin" && (
                        <Button variant="outline" onClick={() => setLocation("/admin/branches")} className="gap-2">
                            <MapPin size={16} /> Manage Branches
                        </Button>
                    )}
                    <Button onClick={startCreate} className="gap-2 shadow-sm">
                        <Plus size={16} /> Add User
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-bold">Name</TableHead>
                            <TableHead className="font-bold">Email</TableHead>
                            <TableHead className="font-bold">Role</TableHead>
                            <TableHead className="font-bold">Branch</TableHead>
                            <TableHead className="font-bold">Asgn. Kitchen</TableHead>
                            <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : usersList?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            usersList?.map((u) => {
                                const branch = branches?.find(b => b.id.toString() === u.branchId?.toString());
                                const assignedKitchen = usersList?.find(k => k.id.toString() === u.assignedKitchenId?.toString());
                                return (
                                    <TableRow key={u.id} className="hover:bg-muted/10 transition-colors">
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell className="text-sm font-light text-muted-foreground">{u.email}</TableCell>
                                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                                        <TableCell>
                                            {branch ? (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <MapPin size={12} className="text-primary/70" />
                                                    {branch.name}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No branch</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {assignedKitchen ? (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <Soup size={12} className="text-orange-500/70" />
                                                    {assignedKitchen.name}
                                                </div>
                                            ) : u.role === "employee" ? (
                                                <span className="text-[10px] font-semibold text-destructive/80 flex items-center gap-1 uppercase">
                                                    <ShieldCheck size={10} /> Unassigned
                                                </span>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => startEdit(u)} className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to remove ${u.name}?`)) {
                                                        deleteMutation.mutate(u.id);
                                                    }
                                                }}
                                                disabled={u.id === user.id}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-bold">
                            {editingUser ? "Edit User" : "Add New User"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                className="rounded-xl border-muted/50 focus:ring-primary/20"
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                className="rounded-xl border-muted/50 focus:ring-primary/20"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {user.role === 'superadmin' && formData.role !== 'superadmin' && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                <Label htmlFor="branch" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Assign to Branch</Label>
                                <select
                                    id="branch"
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value, assignedKitchenId: "" })}
                                >
                                    <option value="">Select a branch</option>
                                    {branches?.map(b => (
                                        <option key={b.id} value={b.id.toString()}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="role" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Role</Label>
                            <select
                                id="role"
                                className="flex h-11 w-full rounded-xl border border-muted/50 bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value, assignedKitchenId: "" })}
                            >
                                <option value="employee">Employee</option>
                                <option value="kitchen">Kitchen Staff</option>
                                {user.role === 'superadmin' && <option value="admin">Branch Admin</option>}
                            </select>
                        </div>

                        {formData.role === "employee" && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                <Label htmlFor="kitchen" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Fulfillment Kitchen</Label>
                                <select
                                    id="kitchen"
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer"
                                    value={formData.assignedKitchenId}
                                    onChange={(e) => setFormData({ ...formData, assignedKitchenId: e.target.value })}
                                >
                                    <option value="">Select a kitchen staff member</option>
                                    {kitchens.map(k => (
                                        <option key={k.id} value={k.id.toString()}>{k.name} ({k.email})</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground italic px-1">Orders from this employee will be sent to the selected kitchen for fulfillment.</p>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                                {editingUser ? "Change Password (leave blank to keep)" : "Password"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                className="rounded-xl border-muted/50 focus:ring-primary/20"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t pt-5 px-1">
                        <Button variant="outline" className="rounded-xl" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            className="rounded-xl px-8 shadow-sm transition-all active:scale-95"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingUser ? "Update User" : "Create User"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
