import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Setup from "@/pages/setup";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import NewCustomer from "@/pages/new-customer";
import CustomerDetail from "@/pages/customer-detail";
import Alerts from "@/pages/alerts";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => getAuthMe(),
    retry: false,
  });

  const publicRoutes = ["/login", "/setup"];
  const isPublicRoute = publicRoutes.includes(location);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sidebar-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.authenticated && !isPublicRoute) {
    return <Redirect to="/login" />;
  }

  if (data?.authenticated && isPublicRoute) {
    return <Redirect to="/" />;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/setup" component={Setup} />
        <Route path="/" component={Dashboard} />
        <Route path="/customers" component={Customers} />
        <Route path="/customers/new" component={NewCustomer} />
        <Route path="/customers/:id" component={CustomerDetail} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
