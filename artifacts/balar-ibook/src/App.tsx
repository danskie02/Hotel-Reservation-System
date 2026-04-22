import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AdminLayout } from "@/components/admin-layout";
import { useGetCurrentUser } from "@workspace/api-client-react";

// Pages
import Home from "@/pages/home";
import Rooms from "@/pages/rooms";
import Book from "@/pages/book";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MyBookings from "@/pages/my-bookings";

// Admin Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminBookings from "@/pages/admin/bookings";
import AdminRooms from "@/pages/admin/rooms";
import AdminUsers from "@/pages/admin/users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { data, isLoading } = useGetCurrentUser();
  const [_, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const user = data?.user;

  if (!user) {
    setLocation(adminOnly ? "/admin/login" : "/login");
    return null;
  }

  if (adminOnly && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" nest>
        <AdminLayout>
          <Switch>
            <Route path="/" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
            <Route path="/bookings" component={() => <ProtectedRoute component={AdminBookings} adminOnly />} />
            <Route path="/rooms" component={() => <ProtectedRoute component={AdminRooms} adminOnly />} />
            <Route path="/users" component={() => <ProtectedRoute component={AdminUsers} adminOnly />} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      {/* Public Routes */}
      <Route path="/" nest>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/rooms" component={Rooms} />
            <Route path="/book/:roomId" component={Book} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/my-bookings" component={() => <ProtectedRoute component={MyBookings} />} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
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
