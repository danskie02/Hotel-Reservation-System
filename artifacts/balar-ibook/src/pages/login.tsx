import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/balar_logo_white.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginUser = useLoginUser();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      const res = await loginUser.mutateAsync({ data });
      console.log("Login response:", res);
      
      if (!res || !res.user) {
        console.error("Login response missing user data:", res);
        form.setError("root", { message: "Login failed: no user data returned" });
        return;
      }
      
      // Invalidate and refetch current user data to ensure it's fresh before redirecting
      await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      await queryClient.refetchQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ description: "Welcome back!" });
      
      console.log("User role:", res.user.role);
      const redirectPath = res.user.role === "admin" ? "/admin" : "/my-bookings";
      console.log("Redirecting to:", redirectPath);
      
      // Use setTimeout to ensure state updates complete
      setTimeout(() => setLocation(redirectPath), 100);
    } catch (error: any) {
      console.error("Login error:", error);
      form.setError("root", { message: "Invalid email or password" });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-secondary/30">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Balar Hotel" className="h-16 w-auto" />
        </div>
        
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-serif font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to manage your bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {form.formState.errors.root && (
                  <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded text-center">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" className="h-11" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-6" 
                  disabled={loginUser.isPending}
                >
                  {loginUser.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col border-t p-6">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create one now
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t w-full text-center">
               <Link href="/admin/login" className="text-xs text-muted-foreground hover:text-foreground">
                Admin Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
