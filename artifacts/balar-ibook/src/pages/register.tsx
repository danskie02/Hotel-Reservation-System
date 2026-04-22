import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/balar_logo_1776822257809.png";

const registerSchema = z.object({
  fullName: z.string().min(1, "Please fill out all fields"),
  email: z.string().email("Invalid email address").min(1, "Please fill out all fields"),
  contactNumber: z.string().min(1, "Please fill out all fields"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[!@#$%^&*()]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please fill out all fields")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerUser = useRegisterUser();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", contactNumber: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await registerUser.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ description: "Account created successfully!" });
      
      // Check if there's a pending booking flow to return to
      const hasDraft = Object.keys(sessionStorage).some(key => key.startsWith('booking-draft-'));
      if (hasDraft) {
        const draftKey = Object.keys(sessionStorage).find(key => key.startsWith('booking-draft-'));
        const roomId = draftKey?.split('-').pop();
        if (roomId) {
          setLocation(`/book/${roomId}`);
          return;
        }
      }
      
      setLocation("/");
    } catch (error: any) {
      form.setError("root", { message: error.message || "Registration failed" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-secondary/30">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Balar Hotel" className="h-16 w-auto" />
        </div>
        
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-serif font-bold">Create Account</CardTitle>
            <CardDescription className="text-base">
              Join us to book your unforgettable stay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded text-center">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 912 345 6789" className="h-11" {...field} />
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
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
                  disabled={registerUser.isPending}
                >
                  {registerUser.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col border-t p-6">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
