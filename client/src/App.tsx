import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Login from "@/pages/Login";
import EmployeeMenu from "@/pages/EmployeeMenu";
import KitchenDashboard from "@/pages/KitchenDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminHistory from "@/pages/AdminHistory";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType, 
  allowedRoles?: string[] 
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard if they try to access unauthorized pages
    if (user.role === "admin") setLocation("/admin");
    else if (user.role === "kitchen") setLocation("/kitchen");
    else setLocation("/");
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Route */}
      <Route path="/login" component={Login} />

      {/* Protected Routes */}
      <Route path="/">
        {() => <ProtectedRoute component={EmployeeMenu} allowedRoles={["employee"]} />}
      </Route>
      
      <Route path="/history">
         {/* Reusing EmployeeMenu component logic for now, or could split into separate HistoryPage */}
        {() => <ProtectedRoute component={EmployeeMenu} allowedRoles={["employee"]} />}
      </Route>

      <Route path="/kitchen">
        {() => <ProtectedRoute component={KitchenDashboard} allowedRoles={["kitchen"]} />}
      </Route>

      <Route path="/kitchen/history">
        {/* Simplified for demo: history view is same dashboard but could have different filters */}
        {() => <ProtectedRoute component={KitchenDashboard} allowedRoles={["kitchen"]} />}
      </Route>

      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>

      <Route path="/admin/menu">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>

      <Route path="/admin/history">
        {() => <ProtectedRoute component={AdminHistory} allowedRoles={["admin"]} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
