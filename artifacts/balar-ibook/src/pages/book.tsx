import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays } from "date-fns";
import { CalendarIcon, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useGetRoom, useGetCurrentUser, useCreateBooking, useLoginUser, useRegisterUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import room1 from "/images/room-1.png";
import room2 from "/images/room-2.png";
import room3 from "/images/room-3.png";
import room4 from "/images/room-4.png";

const fallbackImages = [room1, room2, room3, room4];

const bookingSchema = z.object({
  checkIn: z.date({ required_error: "Check-in date is required" }),
  checkOut: z.date({ required_error: "Check-out date is required" }),
  guestCount: z.coerce.number().min(1, "At least 1 guest required"),
  specialRequests: z.string().optional(),
}).refine(data => data.checkOut > data.checkIn, {
  message: "Check-out date must be after check-in date",
  path: ["checkOut"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[!@#$%^&*()]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Book() {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return apiBaseUrl ? `${apiBaseUrl}${url}` : url;
    return url;
  };

  const { roomId } = useParams();
  const roomIdNum = parseInt(roomId || "0", 10);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: room, isLoading: isLoadingRoom } = useGetRoom(roomIdNum, { query: { enabled: !!roomIdNum } });
  const { data: userData, isLoading: isLoadingUser } = useGetCurrentUser();
  const user = userData?.user;

  const createBooking = useCreateBooking();
  const loginUser = useLoginUser();
  const registerUser = useRegisterUser();

  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: 1,
      specialRequests: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", contactNumber: "", password: "", confirmPassword: "" },
  });

  // Load saved draft from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(`booking-draft-${roomIdNum}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.checkIn) form.setValue("checkIn", new Date(parsed.checkIn));
        if (parsed.checkOut) form.setValue("checkOut", new Date(parsed.checkOut));
        if (parsed.guestCount) form.setValue("guestCount", parsed.guestCount);
        if (parsed.specialRequests) form.setValue("specialRequests", parsed.specialRequests);
      } catch (e) {}
    }
  }, [roomIdNum, form]);

  // Auto-save draft
  useEffect(() => {
    const subscription = form.watch((value) => {
      sessionStorage.setItem(`booking-draft-${roomIdNum}`, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form.watch, roomIdNum]);

  if (isLoadingRoom || isLoadingUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!room) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Room not found</h1>
      <Button asChild><Link href="/rooms">Back to Rooms</Link></Button>
    </div>;
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12 border-primary/20 shadow-lg">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4">Booking Request Sent</h2>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-6">
            Status: Pending
          </div>
          <p className="text-muted-foreground mb-8 px-6">
            Your booking request for {room.name} has been received. Our team will review it shortly. You will receive a confirmation email once approved.
          </p>
          <div className="flex flex-col gap-3 px-8">
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/my-bookings">View My Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const fallbackImage = fallbackImages[room.id % fallbackImages.length];
  const img = room.imageUrl ? resolveImageUrl(room.imageUrl) : fallbackImage;

  const onSubmitBooking = async (data: z.infer<typeof bookingSchema>) => {
    if (!user) return; // Handled by UI
    
    if (data.guestCount > room.capacity) {
      form.setError("guestCount", { message: `Maximum capacity is ${room.capacity}` });
      return;
    }

    try {
      await createBooking.mutateAsync({
        data: {
          roomId: room.id,
          checkIn: format(data.checkIn, "yyyy-MM-dd"),
          checkOut: format(data.checkOut, "yyyy-MM-dd"),
          guestCount: data.guestCount,
          specialRequests: data.specialRequests,
        }
      });
      sessionStorage.removeItem(`booking-draft-${roomIdNum}`);
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred",
      });
    }
  };

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await loginUser.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ description: "Successfully logged in" });
    } catch (error: any) {
      loginForm.setError("root", { message: "Invalid email or password" });
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await registerUser.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast({ description: "Account created successfully" });
    } catch (error: any) {
      registerForm.setError("root", { message: error.message || "Registration failed" });
    }
  };

  return (
    <div className="container max-w-6xl py-12 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
          <Link href="/rooms">← Back to Rooms</Link>
        </Button>
        <h1 className="text-3xl md:text-4xl font-serif font-bold">Complete Your Reservation</h1>
      </div>

      <div className="grid md:grid-cols-[1fr_400px] gap-8">
        {/* Left Column - Forms */}
        <div className="space-y-8">
          {!user ? (
            <Card className="border-primary/20 shadow-md overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/10">
                <h3 className="font-serif font-bold text-lg text-primary">Sign in to complete your booking</h3>
                <p className="text-sm text-muted-foreground">You must have an account to make a reservation.</p>
              </div>
              <CardContent className="p-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        {loginForm.formState.errors.root && (
                          <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded">
                            {loginForm.formState.errors.root.message}
                          </div>
                        )}
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={loginUser.isPending}>
                          {loginUser.isPending ? "Signing in..." : "Sign In & Continue"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        {registerForm.formState.errors.root && (
                          <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded">
                            {registerForm.formState.errors.root.message}
                          </div>
                        )}
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="contactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+63 912 345 6789" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={registerUser.isPending}>
                          {registerUser.isPending ? "Creating Account..." : "Create Account & Continue"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : null}

          <Card className={cn("transition-all duration-300", !user ? "opacity-50 pointer-events-none grayscale-[0.2]" : "")}>
            <CardHeader className="bg-secondary/30 pb-4">
              <CardTitle className="font-serif">Booking Details</CardTitle>
              <CardDescription>Enter your stay dates and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitBooking)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="checkIn"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-neutral-700 font-semibold">Check-in Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn("w-full pl-3 text-left font-normal h-11 border-neutral-300", !field.value && "text-muted-foreground")}
                                >
                                  {field.value ? format(field.value, "EEEE, MMMM d, yyyy") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full sm:w-96 p-6 bg-white border-primary/20 shadow-lg" align="start">
                              <div className="space-y-4">
                                <div className="text-center pb-4 border-b border-neutral-200">
                                  <h3 className="font-serif font-bold text-lg text-neutral-900">Select Check-in Date</h3>
                                  <p className="text-sm text-neutral-600 mt-1">Choose when you'll arrive</p>
                                </div>
                                <div className="flex justify-center">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                    className="text-lg"
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="checkOut"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-neutral-700 font-semibold">Check-out Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn("w-full pl-3 text-left font-normal h-11 border-neutral-300", !field.value && "text-muted-foreground")}
                                >
                                  {field.value ? format(field.value, "EEEE, MMMM d, yyyy") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full sm:w-96 p-6 bg-white border-primary/20 shadow-lg" align="start">
                              <div className="space-y-4">
                                <div className="text-center pb-4 border-b border-neutral-200">
                                  <h3 className="font-serif font-bold text-lg text-neutral-900">Select Check-out Date</h3>
                                  <p className="text-sm text-neutral-600 mt-1">Choose when you'll depart</p>
                                </div>
                                <div className="flex justify-center">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => 
                                      date <= (form.getValues("checkIn") || new Date())
                                    }
                                    initialFocus
                                    className="text-lg"
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Guests (Max: {room.capacity})</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={room.capacity} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special requirements, allergies, or preferences..." 
                            className="resize-none h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {user && (
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg tracking-wider" 
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? "Submitting..." : "Submit Booking Request"}
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Room Summary */}
        <div className="md:order-last order-first mb-8 md:mb-0">
          <Card className="sticky top-24 overflow-hidden border-2 border-primary/30 shadow-lg">
            <div className="relative h-64 overflow-hidden border-b-2 border-primary/30 group">
              <img 
                src={img} 
                alt={room.name} 
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackImage;
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute top-4 right-4 bg-black text-primary px-4 py-2 font-semibold shadow-md border border-primary/40">
                ₱{room.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-300 ml-1">
                  /night
                </span>
              </div>
            </div>
            <CardContent className="p-6 bg-white">
              <h3 className="text-2xl font-serif font-bold mb-3">{room.name}</h3>
              
              <div className="flex items-center text-sm font-medium text-foreground bg-primary/15 border border-primary/30 px-3 py-2 mb-6 w-fit">
                <Users className="w-4 h-4 mr-2" />
                Max {room.capacity} Guests
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                {room.description}
              </p>

              <div className="mb-6 border border-primary/20 bg-primary/5 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-4 text-primary">
                  Amenities Included
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {room.features.map((feature, i) => (
                    <div key={i} className="flex items-start text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider text-xs">
                    Availability
                  </span>
                  <span className="font-bold text-foreground">
                    {room.totalUnits - room.currentOccupied} of {room.totalUnits} Available
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
