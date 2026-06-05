import { useUpdateCustomer } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const PROVIDERS = [
  { id: "tata_play", name: "Tata Play" },
  { id: "airtel", name: "Airtel Digital TV" },
  { id: "dish_tv", name: "Dish TV" },
  { id: "sun_direct", name: "Sun Direct" },
  { id: "d2h", name: "d2h" },
  { id: "zing", name: "Zing Digital" },
  { id: "dd_freedish", name: "DD Free Dish" },
];

const schema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(10),
  address: z.string().optional(),
  provider: z.string().min(1),
  customerId: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: number; name: string; mobile: string; address?: string | null; provider: string; customerId: string };
  onUpdated: () => void;
}

export function EditCustomerDialog({ open, onOpenChange, customer, onUpdated }: Props) {
  const { toast } = useToast();
  const update = useUpdateCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address ?? "",
      provider: customer.provider,
      customerId: customer.customerId,
    },
  });

  const onSubmit = (data: FormValues) => {
    update.mutate({ id: customer.id, data }, {
      onSuccess: () => {
        onUpdated();
        onOpenChange(false);
        toast({ title: "Customer updated" });
      },
      onError: () => {
        toast({ title: "Update failed", variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} data-testid="input-edit-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="mobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile</FormLabel>
                <FormControl><Input {...field} data-testid="input-edit-mobile" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="provider" render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-edit-provider">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="customerId" render={({ field }) => (
              <FormItem>
                <FormLabel>Account ID</FormLabel>
                <FormControl><Input {...field} data-testid="input-edit-customer-id" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Address (optional)</FormLabel>
                <FormControl><Textarea {...field} rows={2} data-testid="input-edit-address" /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={update.isPending} data-testid="button-save-edit">
                {update.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
