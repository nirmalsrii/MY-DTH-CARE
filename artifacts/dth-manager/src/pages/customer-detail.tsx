import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import {
  useGetCustomer,
  getGetCustomerQueryKey,
  useAddRecharge,
  getListRechargesQueryKey,
  getListCustomersQueryKey,
  getGetDashboardStatsQueryKey,
  getGetDueAlertsQueryKey,
  useSendSms,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Phone, MapPin, CreditCard, Plus, MessageSquare, Edit2, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StatusBadge } from "@/components/status-badge";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { EditCustomerDialog } from "@/components/edit-customer-dialog";

const rechargeSchema = z.object({
  rechargeDate: z.string().min(1, "Date is required"),
  validityDays: z.coerce.number().int().min(1, "Validity must be at least 1 day"),
  customerAmountInr: z.coerce.number().optional(),
  amountInr: z.coerce.number().min(0, "Amount required"),
  customerAmountLkr: z.coerce.number().optional(),
  planName: z.string().optional(),
  notes: z.string().optional(),
  sendSms: z.boolean().default(false),
});
type RechargeForm = z.infer<typeof rechargeSchema>;

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id ?? "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { rate } = useExchangeRate();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: customer, isLoading } = useGetCustomer(id, {
    query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) },
  });

  const addRecharge = useAddRecharge();
  const sendSms = useSendSms();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<RechargeForm>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      rechargeDate: today,
      validityDays: 30,
      customerAmountInr: undefined,
      amountInr: 0,
      customerAmountLkr: undefined,
      planName: "",
      notes: "",
      sendSms: false,
    },
  });

  const watchedAmountInr = form.watch("amountInr") || 0;
  const watchedCustomerAmountInr = form.watch("customerAmountInr");
  const watchedCustomerAmountLkr = form.watch("customerAmountLkr");
  const watchedRechargeDate = form.watch("rechargeDate");
  const watchedValidityDays = form.watch("validityDays") || 30;
  const watchedSendSms = form.watch("sendSms");

  const costLkr = watchedAmountInr * rate;
  const profitLkr = watchedCustomerAmountLkr != null && watchedCustomerAmountLkr > 0
    ? watchedCustomerAmountLkr - costLkr
    : null;

  // When customer INR amount is entered, auto-fill LKR field
  const handleCustomerInrChange = (inrVal: number | undefined) => {
    form.setValue("customerAmountInr", inrVal);
    if (inrVal != null && inrVal > 0) {
      form.setValue("customerAmountLkr", parseFloat((inrVal * rate).toFixed(2)));
    }
  };

  // Calculate next recharge date for SMS preview
  const nextRechargeDatePreview = (() => {
    try {
      const d = new Date(watchedRechargeDate);
      d.setDate(d.getDate() + watchedValidityDays);
      return d.toDateString();
    } catch { return ""; }
  })();

  const smsCustomerAmount = watchedCustomerAmountLkr ?? null;
  const smsPreview = customer
    ? `Dear ${customer.name}, your account has been recharged for ${watchedValidityDays} days.${smsCustomerAmount != null ? ` Amount: Rs.${smsCustomerAmount.toFixed(0)}.` : ""} Next due: ${nextRechargeDatePreview}. - DTH Manager`
    : "";

  const onSubmitRecharge = (data: RechargeForm) => {
    const amountLkr = data.amountInr * rate;
    addRecharge.mutate(
      {
        customerId: id,
        data: {
          rechargeDate: data.rechargeDate,
          validityDays: data.validityDays,
          amountInr: data.amountInr,
          amountLkr,
          customerAmountLkr: data.customerAmountLkr || undefined,
          planName: data.planName || undefined,
          notes: data.notes || undefined,
          sendSms: data.sendSms,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListRechargesQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDueAlertsQueryKey() });
          form.reset({ rechargeDate: today, validityDays: 30, customerAmountInr: undefined, amountInr: 0, customerAmountLkr: undefined, planName: "", sendSms: false });
          toast({ title: "Recharge added successfully" });

          if (data.sendSms && customer) {
            sendSms.mutate(
              { data: { customerId: id, message: smsPreview, mobile: customer.mobile } },
              { onError: () => toast({ title: "SMS send failed", variant: "destructive" }) }
            );
          }
        },
        onError: () => {
          toast({ title: "Failed to add recharge", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Customer not found.</p>
        <Link href="/customers"><Button variant="link" className="mt-2">Back to list</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/customers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <StatusBadge status={customer.status} />
            <ProviderBadge provider={customer.provider} />
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditDialog(true)} data-testid="button-edit">
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-5">
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Phone} label="Mobile" value={customer.mobile} />
                <InfoItem icon={CreditCard} label="Account ID" value={customer.customerId} mono />
                {customer.address && <InfoItem icon={MapPin} label="Address" value={customer.address} className="col-span-2" />}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Last Recharge</p>
                  <p className="text-sm font-medium">{customer.lastRechargeDate ?? "No recharges yet"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Next Due</p>
                  <p className={`text-sm font-medium ${customer.daysUntilExpiry != null && customer.daysUntilExpiry < 0 ? "text-red-600" : customer.daysUntilExpiry != null && customer.daysUntilExpiry <= 7 ? "text-amber-600" : ""}`}>
                    {customer.nextRechargeDate ?? "—"}
                    {customer.daysUntilExpiry != null && (
                      <span className="ml-1.5 text-xs">
                        ({customer.daysUntilExpiry < 0 ? `${Math.abs(customer.daysUntilExpiry)}d overdue` : `${customer.daysUntilExpiry}d left`})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recharge History */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recharge History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.recharges.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No recharges yet</div>
              ) : (
                <div className="divide-y">
                  {[...customer.recharges].reverse().map(r => (
                    <div key={r.id} className="px-5 py-3 flex items-start justify-between" data-testid={`recharge-row-${r.id}`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{r.rechargeDate}</p>
                          <span className="text-xs text-muted-foreground">→ {r.nextRechargeDate}</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.validityDays}d</span>
                        </div>
                        {r.planName && <p className="text-xs text-muted-foreground">{r.planName}</p>}
                        {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                      </div>
                      <div className="text-right space-y-0.5">
                        <div>
                          <p className="text-xs text-muted-foreground">Cost</p>
                          <CurrencyDisplay amountInr={r.amountInr} amountLkr={r.amountLkr} />
                        </div>
                        {r.customerAmountLkr != null && (
                          <div>
                            <p className="text-xs text-muted-foreground">Customer paid</p>
                            <p className="text-sm font-medium">Rs. {r.customerAmountLkr.toFixed(2)}</p>
                          </div>
                        )}
                        {r.profitMargin != null && (
                          <p className={`text-xs font-semibold ${r.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            Profit: Rs. {r.profitMargin.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Add Recharge Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Recharge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitRecharge)} className="space-y-3">
                  <FormField control={form.control} name="rechargeDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recharge Date</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-recharge-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="validityDays" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity (days)</FormLabel>
                      <FormControl><Input type="number" {...field} placeholder="30" data-testid="input-validity" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Customer Amount INR → auto-fills LKR */}
                  <FormField control={form.control} name="customerAmountInr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Amount (INR) <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount you charge customer in INR"
                          value={field.value ?? ""}
                          onChange={e => handleCustomerInrChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          data-testid="input-customer-amount-inr"
                        />
                      </FormControl>
                      <FormMessage />
                      {watchedCustomerAmountInr != null && watchedCustomerAmountInr > 0 && (
                        <div className="text-xs bg-muted/60 rounded px-2 py-1.5 mt-1">
                          <span className="text-muted-foreground">= Rs. </span>
                          <span className="font-semibold text-foreground">{(watchedCustomerAmountInr * rate).toFixed(2)}</span>
                          <span className="text-muted-foreground ml-1">LKR (auto-filled below)</span>
                        </div>
                      )}
                    </FormItem>
                  )} />

                  {/* Amount INR + cost LKR */}
                  <FormField control={form.control} name="amountInr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Amount (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} placeholder="399" data-testid="input-amount-inr" />
                      </FormControl>
                      <FormMessage />
                      {watchedAmountInr > 0 && (
                        <div className="text-xs bg-muted/60 rounded px-2 py-1.5 mt-1">
                          <span className="text-muted-foreground">Cost LKR: </span>
                          <span className="font-semibold text-foreground">Rs. {costLkr.toFixed(2)}</span>
                          <span className="text-muted-foreground ml-1">(@ {rate} per INR)</span>
                        </div>
                      )}
                    </FormItem>
                  )} />

                  {/* Customer Amount LKR */}
                  <FormField control={form.control} name="customerAmountLkr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Amount (LKR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="What customer pays in Rs."
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          data-testid="input-customer-amount"
                        />
                      </FormControl>
                      <FormMessage />
                      {profitLkr != null && (
                        <div className={`text-xs rounded px-2 py-1.5 mt-1 font-semibold ${profitLkr >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          <TrendingUp className="inline w-3 h-3 mr-1" />
                          Profit: Rs. {profitLkr.toFixed(2)}
                          {profitLkr < 0 && " (loss)"}
                        </div>
                      )}
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="planName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. HD Dhamaka" data-testid="input-plan-name" /></FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl><Textarea {...field} rows={2} placeholder="Any notes..." data-testid="input-notes" /></FormControl>
                    </FormItem>
                  )} />

                  <Separator />

                  <FormField control={form.control} name="sendSms" render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          Send SMS notification
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">Notify customer after recharge</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-send-sms" />
                      </FormControl>
                    </FormItem>
                  )} />

                  {/* SMS Preview */}
                  {watchedSendSms && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1.5">
                        <Info className="w-3 h-3" />
                        SMS Preview ({smsPreview.length} chars)
                      </p>
                      <p className="text-xs text-blue-800 leading-relaxed break-words">{smsPreview}</p>
                      <p className="text-xs text-blue-500 mt-1.5">→ Will be sent to {customer?.mobile}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={addRecharge.isPending} data-testid="button-submit-recharge">
                    {addRecharge.isPending ? "Adding..." : "Add Recharge"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditCustomerDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        customer={customer}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        }}
      />
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono, className }: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
