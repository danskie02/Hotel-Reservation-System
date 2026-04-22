import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useLoginUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/balar_logo_1776822257809.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
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
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      
      if (res.user.role === "admin") {
        toast({ description: "Admin authentication successful" });
        setLocation("/admin");
      } else {
        toast({ variant: "destructive", description: "Unauthorized access. Admin privileges required." });
        // Although logged in, they aren't admin. App.tsx will route them away, but we should force a visual error here too.
        form.setError("root", { message: "Unauthorized access. Admin privileges required." });
      }
    } catch (error: any) {
      form.setError("root", { message: "Invalid credentials" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] text-white">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Balar Hotel" className="h-20 w-auto invert" />
        </div>
        
        <Card className="border-gray-800 bg-[#111111] text-white shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8 border-b border-gray-800">
            <CardTitle className="text-2xl font-serif font-bold text-primary">Admin Portal</CardTitle>
            <CardDescription className="text-gray-400">
              Secure management system access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.root && (
                  <div className="text-red-400 text-sm font-medium p-3 bg-red-950/30 border border-red-900/50 rounded text-center">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Administrator Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="admin@balarhotel.com" 
                          className="h-12 bg-black border-gray-800 focus-visible:ring-primary text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="h-12 bg-black border-gray-800 focus-visible:ring-primary text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold tracking-widest uppercase bg-primary hover:bg-primary/80 text-primary-foreground mt-8" 
                  disabled={loginUser.isPending}
                >
                  {loginUser.isPending ? "Authenticating..." : "Authenticate"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
