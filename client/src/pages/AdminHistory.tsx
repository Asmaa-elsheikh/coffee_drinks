import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Download, History, Loader2, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { orders, isLoading } = useOrders({});
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  if (!user || user.role !== "admin") {
    if (user && user.role !== "admin") setLocation("/");
    return null;
  }

  // Debugging: Ensure we see what data is coming in
  if (orders) {
    console.log("Total orders fetched:", orders.length);
    console.log("First order date:", orders[0]?.createdAt);
  }

  // Generate last 12 months for the filter
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return format(d, "yyyy-MM");
  });

  const filteredOrders = orders?.filter(order => {
    const orderDate = new Date(order.createdAt);
    // Use local time for filtering to match what users see
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const orderMonth = `${year}-${month}`;
    
    // Debug specific month
    if (orderMonth === "2026-01") {
      console.log("Found Jan 2026 order:", order.id, "User:", order.user.email);
    }
    
    return orderMonth === selectedMonth;
  });

  const aggregatedData = filteredOrders?.reduce((acc: Record<string, any>, order) => {
    const date = format(new Date(order.createdAt), "yyyy-MM-dd");
    const employeeName = order.user.name;
    const drinkName = order.drink.name;
    
    const key = `${date}_${employeeName}`;
    if (!acc[key]) {
      acc[key] = {
        date,
        employeeName,
        drinks: {} as Record<string, number>,
        totalCount: 0
      };
    }
    
    acc[key].drinks[drinkName] = (acc[key].drinks[drinkName] || 0) + 1;
    acc[key].totalCount += 1;
    return acc;
  }, {});

  const historyRows: any[] = Object.values(aggregatedData || {}).sort((a: any, b: any) => 
    b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName)
  );

  const exportToExcel = () => {
    if (historyRows.length === 0) return;

    try {
      const headers = ["Date", "Employee", "Drinks Ordered", "Total Count"];
      const csvContent = [
        headers.join(","),
        ...historyRows.map((row: any) => {
          const drinksSummary = Object.entries(row.drinks as Record<string, number>)
            .map(([name, count]) => `${name} (x${count})`)
            .join("; ");
          const cleanEmployeeName = (row.employeeName || "").toString().replace(/"/g, '""');
          const cleanDrinksSummary = drinksSummary.replace(/"/g, '""');
          return `"${row.date}","${cleanEmployeeName}","${cleanDrinksSummary}",${row.totalCount}`;
        })
      ].join("\n");

      // Ensure UTF-8 with BOM for Excel compatibility
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `drink_history_${selectedMonth}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Export failed:", error);
    }
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m} value={m}>
                    {format(parseISO(`${m}-01`), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportToExcel} disabled={historyRows.length === 0} className="gap-2 rounded-xl">
            <Download size={16} /> Export CSV
          </Button>
        </div>
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
                      {Object.entries(row.drinks as Record<string, number>).map(([name, count]) => (
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
