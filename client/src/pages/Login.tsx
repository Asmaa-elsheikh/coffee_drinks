import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Coffee, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <Layout showNav={false}>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl border-primary/10">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Coffee size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Welcome Back</CardTitle>
              <CardDescription>Sign in to order your office drinks</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  placeholder="employee@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 text-base" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin mr-2" /> : null}
                Sign In
              </Button>
              
              <div className="bg-muted/50 p-4 rounded-xl text-xs space-y-2 border border-border mt-4">
                <p className="font-semibold text-foreground uppercase tracking-wider">Demo Credentials:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground">Employee:</p>
                    <p className="font-mono">employee1@company.com / password123</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kitchen:</p>
                    <p className="font-mono">kitchen@company.com / password123</p>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border/50">
                    <p className="text-muted-foreground">Admin:</p>
                    <p className="font-mono">admin@company.com / password123</p>
                  </div>
                </div>
                <p className="pt-2 text-[10px] text-muted-foreground italic">* Role-based portals: Admin manages menu, Kitchen handles queue, Employee orders.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
