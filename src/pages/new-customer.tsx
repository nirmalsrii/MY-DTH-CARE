import { useLocation } from "wouter";
import { useCreateCustomer, getListCustomersQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const PROVIDERS = [
  { id: "tata_play", name: "Tata Play", validity: 30 },
  { id: "airtel", name: "Airtel Digital TV", validity: 30 },
  { id: "dish_tv", name: "Dish TV", validity: 30 },
  { id: "sun_direct", name: "Sun Direct", validity: 30 },
  { id: "d2h", name: "d2h", validity: 30 },
  { id: "zing", name: "Zing Digital", validity: 28 },
  { id: "dd_freedish", name: "DD Free Dish", validity: 365 },
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  address: z.string().optional(),
  provider: z.string().min(1, "Provider is required"),
  customerId: z.string().min(1, "Customer/Account ID is required"),
});
type FormValues = z.infer<typeof schema>;

export default function NewCustomer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", mobile: "", address: "", provider: "", customerId: "" },
  });

  const onSubmit = (data: FormValues) => {
    create.mutate({ data }, {
      onSuccess: (customer) => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Customer added successfully" });
        setLocation(`/customers/${customer.id}`);
      },
      onError: () => {
        toast({ title: "Failed to add customer", variant: "destructive" });
      },
    });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/customers">
          <a className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </a>
        </Link>
        <h1 className="text-2xl font-bold">Add New Customer</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new DTH subscriber</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Kumara Perera" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 0771234567" data-testid="input-mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DTH Provider</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-provider">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROVIDERS.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer / Account ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. TP-10234567" data-testid="input-customer-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="e.g. No. 45, Galle Road, Colombo 03" rows={2} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Link href="/customers">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={create.isPending} data-testid="button-submit">
                  {create.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
