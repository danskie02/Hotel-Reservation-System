import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/balar_logo_1776822257809.png";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data } = useGetCurrentUser();
  const user = data?.user;
  const logout = useLogoutUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout.mutateAsync(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ description: "Successfully logged out" });
        setLocation("/");
      },
    });
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src={logo} alt="Balar Hotel and Spa" className="h-10 w-auto" />
          <span className="hidden font-serif text-xl font-bold tracking-tight text-foreground sm:inline-block">
            BALAR iBOOK
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/rooms" className="text-sm font-medium transition-colors hover:text-primary">
            Rooms
          </Link>
          
          {user ? (
            <>
              {user.role === "admin" ? (
                <Link href="/admin" className="text-sm font-medium transition-colors hover:text-primary">
                  Admin Dashboard
                </Link>
              ) : (
                <Link href="/my-bookings" className="text-sm font-medium transition-colors hover:text-primary">
                  My Bookings
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/admin/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Admin
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b bg-background px-4 py-4 shadow-lg animate-in slide-in-from-top-4">
          <nav className="flex flex-col gap-4">
            <Link href="/" onClick={closeMenu} className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/rooms" onClick={closeMenu} className="text-sm font-medium transition-colors hover:text-primary">
              Rooms
            </Link>
            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link href="/admin" onClick={closeMenu} className="text-sm font-medium transition-colors hover:text-primary">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link href="/my-bookings" onClick={closeMenu} className="text-sm font-medium transition-colors hover:text-primary">
                    My Bookings
                  </Link>
                )}
                <Button variant="ghost" onClick={() => { handleLogout(); closeMenu(); }} className="justify-start gap-2 px-0">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/admin/login" onClick={closeMenu} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Admin Login
                </Link>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button variant="outline" asChild className="w-full justify-center">
                    <Link href="/login" onClick={closeMenu}>Sign In</Link>
                  </Button>
                  <Button asChild className="w-full justify-center">
                    <Link href="/register" onClick={closeMenu}>Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-black text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src={logo} alt="Balar Hotel and Spa" className="h-12 w-auto mb-4 invert" />
            <p className="text-gray-400 max-w-sm">
              Experience luxury and tropical hospitality at Boac, Marinduque. A sanctuary where elegance meets the sea.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-primary mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/rooms" className="text-gray-400 hover:text-primary transition-colors">Our Rooms</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-primary transition-colors">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-primary mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Boac, Marinduque</li>
              <li>Philippines</li>
              <li>info@balarhotel.com</li>
              <li>+63 (123) 456-7890</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Balar Hotel & Spa. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
