import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Calendar, BedDouble, Users, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import logo from "@assets/balar_logo_1776822257809.png";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
  },
  {
    title: "Rooms",
    href: "/admin/rooms",
    icon: BedDouble,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data } = useGetCurrentUser();
  const user = data?.user;
  const logout = useLogoutUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ description: "Successfully logged out" });
        setLocation("/admin/login");
      },
    });
  };

  const NavItems = () => (
    <div className="space-y-1">
      {sidebarNavItems.map((item) => (
        <Button
          key={item.href}
          variant={location === item.href ? "secondary" : "ghost"}
          className={`w-full justify-start ${location === item.href ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
          asChild
          onClick={() => setOpen(false)}
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="flex h-16 items-center gap-4 border-b bg-sidebar px-6 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground border-sidebar-border">
            <div className="flex h-16 items-center border-b border-sidebar-border px-6">
              <img src={logo} alt="Balar Hotel" className="h-8 w-auto invert" />
              <span className="ml-3 font-serif font-bold tracking-tight">Admin</span>
            </div>
            <ScrollArea className="flex-1 py-6 px-4">
              <NavItems />
            </ScrollArea>
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 px-2 py-3 mb-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.fullName}</span>
                  <span className="text-xs text-sidebar-foreground/70">{user?.email}</span>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-center">
          <img src={logo} alt="Balar Hotel" className="h-8 w-auto invert" />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex sticky top-0 h-screen">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <img src={logo} alt="Balar Hotel" className="h-8 w-auto invert" />
          <span className="ml-3 font-serif font-bold tracking-tight">Admin</span>
        </div>
        <ScrollArea className="flex-1 py-6 px-4">
          <NavItems />
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.fullName}</span>
              <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
