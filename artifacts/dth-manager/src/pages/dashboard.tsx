import { useGetDashboardStats, useGetDueAlerts, getGetDashboardStatsQueryKey, getGetDueAlertsQueryKey, useRefreshAllStatuses } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Wifi, AlertTriangle, XCircle, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const PROVIDER_COLORS = ["#1e3a5f", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: alerts } = useGetDueAlerts(undefined, { query: { queryKey: getGetDueAlertsQueryKey() } });
  const refresh = useRefreshAllStatuses();

  const handleRefresh = () => {
    refresh.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDueAlertsQueryKey() });
        toast({ title: "Statuses refreshed" });
      },
    });
  };

  const urgentCount = (alerts?.dueToday?.length ?? 0) + (alerts?.overdue?.length ?? 0);
  const expiringCount = (alerts?.dueIn3Days?.length ?? 0) + (alerts?.dueIn7Days?.length ?? 0);

  const pieData = stats?.customersByProvider?.map(p => ({
    name: p.provider.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value: p.count,
  })) ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of all DTH subscriptions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refresh.isPending}
          className="gap-2"
          data-testid="button-refresh-status"
        >
          <RefreshCw className={`w-4 h-4 ${refresh.isPending ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={stats?.totalCustomers}
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          isLoading={isLoading}
        />
        <StatCard
          label="Active"
          value={stats?.activeCustomers}
          icon={Wifi}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          isLoading={isLoading}
        />
        <StatCard
          label="Expiring Soon"
          value={stats?.expiringSoonCustomers}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          isLoading={isLoading}
        />
        <StatCard
          label="Expired"
          value={stats?.expiredCustomers}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Cards */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <CurrencyDisplay amountInr={stats?.monthlyRevenueInr ?? 0} />
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <CurrencyDisplay amountInr={stats?.totalRevenueInr ?? 0} />
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Due Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
                  <p className="text-xs text-muted-foreground">Overdue/Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{expiringCount}</p>
                  <p className="text-xs text-muted-foreground">In 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customers by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PROVIDER_COLORS[i % PROVIDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Due Alerts Preview */}
      {(urgentCount > 0 || expiringCount > 0) && (
        <Card className="shadow-sm border-red-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                Urgent Attention Required
              </CardTitle>
              <Link href="/alerts">
                <a className="text-xs text-primary hover:underline font-medium" data-testid="link-view-all-alerts">View all</a>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...(alerts?.overdue ?? []), ...(alerts?.dueToday ?? [])].slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100" data-testid={`alert-customer-${c.id}`}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.mobile}</p>
                    </div>
                    <ProviderBadge provider={c.provider} />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <Link href={`/customers/${c.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs" data-testid={`button-recharge-${c.id}`}>Recharge</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg, isLoading }: {
  label: string;
  value?: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isLoading: boolean;
}) {
  return (
    <Card className="shadow-sm" data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
