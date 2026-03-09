import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, MapPin, Loader2, Building } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminBranches() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newBranchName, setNewBranchName] = useState("");

    const { data: branches, isLoading } = useQuery<any[]>({
        queryKey: ["/api/branches"],
    });

    const createMutation = useMutation({
        mutationFn: async (branch: { name: string }) => {
            const res = await apiRequest("POST", "/api/branches", branch);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
            toast({ title: "Branch created successfully" });
            setIsDialogOpen(false);
            setNewBranchName("");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create branch",
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/branches/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
            toast({ title: "Branch removed successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: "Could not delete branch. It might have active users or drinks.",
                variant: "destructive"
            });
        }
    });

    if (!user || user.role !== "superadmin") {
        if (user && user.role !== "superadmin") setLocation("/admin");
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                        <Building className="text-primary" size={32} />
                        Branch Management
                    </h2>
                    <p className="text-muted-foreground">Manage physical locations and branch offices</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus size={16} /> Add Branch
                </Button>
            </div>

            <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Branch Name</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center">
                                    <Loader2 className="animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : branches?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    No branches found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            branches?.map((b) => (
                                <TableRow key={b.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <MapPin size={16} className="text-primary/60" />
                                        {b.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">#{b.id}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(b.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to delete the ${b.name} branch?`)) {
                                                    deleteMutation.mutate(b.id);
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Branch</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="branchName">Branch Name</Label>
                            <Input
                                id="branchName"
                                placeholder="e.g. London Office, 5th Floor"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => createMutation.mutate({ name: newBranchName })}
                            disabled={!newBranchName || createMutation.isPending}
                        >
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Branch
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
