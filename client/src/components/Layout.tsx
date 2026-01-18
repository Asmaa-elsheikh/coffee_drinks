import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Coffee, 
  LogOut, 
  LayoutDashboard, 
  ChefHat, 
  ClipboardList,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!showNav) return <main className="min-h-screen bg-background">{children}</main>;

  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/", label: "Menu View", icon: Coffee },
      ];
    }
    if (user?.role === "kitchen") {
      return [
        { href: "/kitchen", label: "Kitchen Queue", icon: ChefHat },
        { href: "/kitchen/history", label: "History", icon: ClipboardList },
      ];
    }
    // Employee
    return [
      { href: "/", label: "Menu", icon: Coffee },
      { href: "/history", label: "My Orders", icon: ClipboardList },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar / Mobile Header */}
      <nav className="sticky top-0 z-50 md:h-screen w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col justify-between shrink-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Coffee size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none">BrewWait</h1>
              <p className="text-xs text-muted-foreground mt-1">Office Drinks</p>
            </div>
          </div>

          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}>
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <UserCircle className="text-muted-foreground" size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={() => logout()}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-full">
        <div className="max-w-7xl mx-auto animate-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
