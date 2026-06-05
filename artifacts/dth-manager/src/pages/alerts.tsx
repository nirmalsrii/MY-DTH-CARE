import { useState } from "react";
import { Link } from "wouter";
import { useGetDueAlerts, getGetDueAlertsQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Alerts() {
  const { data: alerts, isLoading } = useGetDueAlerts(undefined, { query: { queryKey: getGetDueAlertsQueryKey() } });

  const tabs = [
    { key: "overdue", label: "Overdue", data: alerts?.overdue ?? [], color: "text-red-600", bg: "bg-red-50 border-red-100" },
    { key: "today", label: "Due Today", data: alerts?.dueToday ?? [], color: "text-red-500", bg: "bg-red-50/60 border-red-100" },
    { key: "3days", label: "In 3 Days", data: alerts?.dueIn3Days ?? [], color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { key: "7days", label: "In 7 Days", data: alerts?.dueIn7Days ?? [], color: "text-amber-500", bg: "bg-amber-50/60 border-amber-100" },
    { key: "15days", label: "In 15 Days", data: alerts?.dueIn15Days ?? [], color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  ];

  const totalAlerts = tabs.reduce((s, t) => s + t.data.length, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Due Alerts
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? "Loading..." : `${totalAlerts} customer${totalAlerts !== 1 ? "s" : ""} need attention`}
        </p>
      </div>

      <Tabs defaultValue="overdue">
        <TabsList className="flex-wrap h-auto gap-1">
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5" data-testid={`tab-${t.key}`}>
              {t.label}
              {t.data.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-bold">
                  {t.data.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(t => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : t.data.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">No customers in this category</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {t.data.map(c => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${t.bg}`}
                    data-testid={`alert-row-${c.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.mobile}</p>
                        {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
                      </div>
                      <ProviderBadge provider={c.provider} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Next due</p>
                        <p className={`text-sm font-semibold ${t.color}`}>
                          {c.nextRechargeDate ?? "—"}
                        </p>
                        {c.daysUntilExpiry != null && (
                          <p className={`text-xs font-medium ${t.color}`}>
                            {c.daysUntilExpiry < 0 ? `${Math.abs(c.daysUntilExpiry)}d overdue` : `${c.daysUntilExpiry}d left`}
                          </p>
                        )}
                      </div>
                      <Link href={`/customers/${c.id}`}>
                        <Button size="sm" className="gap-1.5" data-testid={`button-recharge-alert-${c.id}`}>
                          <Clock className="w-3.5 h-3.5" />
                          Recharge
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
