import { useAdminLogin, getGetAuthMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Satellite, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const login = useAdminLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Please check your username and password.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-sidebar-primary flex items-center justify-center mb-4 shadow-xl">
            <Satellite className="w-8 h-8 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-sidebar-foreground">DTH Manager</h1>
          <p className="text-sm text-sidebar-foreground/50 mt-1">Sri Lanka Operations Portal</p>
        </div>

        {/* Card */}
        <div className="bg-sidebar-accent rounded-xl p-8 shadow-2xl border border-sidebar-border">
          <h2 className="text-lg font-semibold text-sidebar-foreground mb-1">Admin Sign In</h2>
          <p className="text-sm text-sidebar-foreground/50 mb-6">Enter your credentials to access the dashboard</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sidebar-foreground/70">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
                        <Input
                          {...field}
                          placeholder="admin"
                          className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:border-sidebar-primary"
                          data-testid="input-username"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sidebar-foreground/70">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:border-sidebar-primary"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 font-semibold mt-2"
                disabled={login.isPending}
                data-testid="button-submit"
              >
                {login.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/30 text-center">
              Default: admin / dth@admin2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
