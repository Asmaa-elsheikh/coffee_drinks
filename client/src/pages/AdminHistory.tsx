import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Download, History, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { orders, isLoading } = useOrders({ status: "completed" });

  if (!user || user.role !== "admin") {
    if (user && user.role !== "admin") setLocation("/");
    return null;
  }

  // Aggregate orders by employee and date
  const aggregatedData = orders?.reduce((acc: any, order) => {
    const date = format(new Date(order.createdAt), "yyyy-MM-dd");
    const employeeName = order.user.name;
    const drinkName = order.drink.name;
    
    const key = `${date}_${employeeName}`;
    if (!acc[key]) {
      acc[key] = {
        date,
        employeeName,
        drinks: {},
        totalCount: 0
      };
    }
    
    acc[key].drinks[drinkName] = (acc[key].drinks[drinkName] || 0) + 1;
    acc[key].totalCount += 1;
    return acc;
  }, {});

  const historyRows = Object.values(aggregatedData || {}).sort((a: any, b: any) => 
    b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName)
  );

  const exportToCSV = () => {
    if (historyRows.length === 0) return;

    const headers = ["Date", "Employee", "Drinks Ordered", "Total Count"];
    const csvContent = [
      headers.join(","),
      ...historyRows.map((row: any) => {
        const drinksSummary = Object.entries(row.drinks)
          .map(([name, count]) => `${name} (x${count})`)
          .join("; ");
        return `"${row.date}","${row.employeeName}","${drinksSummary}",${row.totalCount}`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `drink_history_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold flex items-center gap-3">
            <History className="text-primary" size={32} />
            Order History
          </h2>
          <p className="text-muted-foreground">Review aggregated drink requests by employee and day</p>
        </div>
        <Button onClick={exportToCSV} disabled={historyRows.length === 0} className="gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Drinks Ordered</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : historyRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No order history found.
                </TableCell>
              </TableRow>
            ) : (
              historyRows.map((row: any, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(row.drinks).map(([name, count]) => (
                        <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {name} x{count}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{row.totalCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
