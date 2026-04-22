import { useState } from "react";
import { useAdminListBookings, getAdminListBookingsQueryKey, useAdminDecideBooking, getAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminBookings() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  const queryParams = filter === "all" ? {} : { status: filter };
  const { data: bookings = [], isLoading } = useAdminListBookings(queryParams, { 
    query: { queryKey: getAdminListBookingsQueryKey(queryParams) } 
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const decideBooking = useAdminDecideBooking();

  const handleDecision = async (id: number, decision: "approve" | "reject") => {
    try {
      await decideBooking.mutateAsync({ id, data: { decision } });
      queryClient.invalidateQueries({ queryKey: getAdminListBookingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminListStatsQueryKey() }); // Using manual invalidation
      toast({ description: `Booking ${decision}d successfully.` });
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || `Failed to ${decision} booking.` });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getAdminListStatsQueryKey = getAdminStatsQueryKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-sidebar-foreground">Bookings</h1>
          <p className="text-sidebar-foreground/60">Manage all reservation requests.</p>
        </div>
        
        <div className="flex bg-sidebar-border/50 p-1 rounded-lg">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === status 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-sidebar border-sidebar-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border hover:bg-transparent">
                  <TableHead className="text-sidebar-foreground/70">Guest Info</TableHead>
                  <TableHead className="text-sidebar-foreground/70">Room</TableHead>
                  <TableHead className="text-sidebar-foreground/70">Dates</TableHead>
                  <TableHead className="text-sidebar-foreground/70">Status</TableHead>
                  <TableHead className="text-right text-sidebar-foreground/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sidebar-foreground/50">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sidebar-foreground/50">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id} className="border-sidebar-border hover:bg-sidebar-accent/50">
                      <TableCell>
                        <div className="font-medium text-sidebar-foreground">{booking.guestName}</div>
                        <div className="text-xs text-sidebar-foreground/60">{booking.guestEmail}</div>
                        <div className="text-xs text-sidebar-foreground/60">{booking.guestContact}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sidebar-foreground">{booking.roomName}</div>
                        <div className="text-xs text-sidebar-foreground/60">{booking.guestCount} Guests</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-sidebar-foreground whitespace-nowrap">
                          {format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-sidebar-foreground/50 mt-1 whitespace-nowrap">
                          Req: {format(new Date(booking.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            onClick={() => setSelectedBooking(booking)}
                            title="View Details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          
                          {booking.status === "pending" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/20"
                                onClick={() => handleDecision(booking.id, "approve")}
                                disabled={decideBooking.isPending}
                                title="Approve"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                                onClick={() => handleDecision(booking.id, "reject")}
                                disabled={decideBooking.isPending}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="bg-sidebar text-sidebar-foreground border-sidebar-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Booking Details</DialogTitle>
            <DialogDescription className="text-sidebar-foreground/60">
              Ref: #{selectedBooking?.id.toString().padStart(4, '0')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-sidebar-foreground/50 block mb-1">Status</span>
                  <Badge variant="outline" className={`capitalize ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sidebar-foreground/50 block mb-1">Room</span>
                  <span className="font-medium">{selectedBooking.roomName}</span>
                </div>
                
                <div>
                  <span className="text-sidebar-foreground/50 block mb-1">Check-in</span>
                  <span className="font-medium">{format(new Date(selectedBooking.checkIn), "MMM d, yyyy")}</span>
                </div>
                <div>
                  <span className="text-sidebar-foreground/50 block mb-1">Check-out</span>
                  <span className="font-medium">{format(new Date(selectedBooking.checkOut), "MMM d, yyyy")}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-sidebar-foreground/50 block mb-1">Guest Details</span>
                  <div className="bg-sidebar-accent/50 p-3 rounded-md">
                    <div className="font-medium">{selectedBooking.guestName} ({selectedBooking.guestCount} Guests)</div>
                    <div className="text-sidebar-foreground/80">{selectedBooking.guestEmail}</div>
                    <div className="text-sidebar-foreground/80">{selectedBooking.guestContact}</div>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="col-span-2">
                    <span className="text-sidebar-foreground/50 block mb-1">Special Requests</span>
                    <div className="bg-sidebar-accent/30 p-3 rounded-md italic border-l-2 border-primary">
                      "{selectedBooking.specialRequests}"
                    </div>
                  </div>
                )}
                
                {selectedBooking.decidedAt && (
                  <div className="col-span-2 text-xs text-sidebar-foreground/50 text-right mt-2 pt-2 border-t border-sidebar-border">
                    Decision made on: {format(new Date(selectedBooking.decidedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 sm:justify-between">
            <Button variant="ghost" onClick={() => setSelectedBooking(null)} className="text-sidebar-foreground hover:bg-sidebar-accent">
              Close
            </Button>
            
            {selectedBooking?.status === "pending" && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-red-500/50 text-red-500 hover:bg-red-500/20"
                  onClick={() => {
                    handleDecision(selectedBooking.id, "reject");
                    setSelectedBooking(null);
                  }}
                  disabled={decideBooking.isPending}
                >
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    handleDecision(selectedBooking.id, "approve");
                    setSelectedBooking(null);
                  }}
                  disabled={decideBooking.isPending}
                >
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
