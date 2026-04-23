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
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getAdminListStatsQueryKey = getAdminStatsQueryKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-neutral-900">Bookings</h1>
          <p className="text-neutral-600">Manage all reservation requests.</p>
        </div>
        
        <div className="flex rounded-lg border border-primary/20 bg-white p-1 shadow-sm">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === status 
                  ? "bg-primary/15 text-primary shadow-sm" 
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-primary/20 bg-white shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-200 hover:bg-neutral-100">
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6">Guest Info</TableHead>
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6">Room</TableHead>
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6">Dates</TableHead>
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6">Status</TableHead>
                  <TableHead className="text-right text-neutral-700 font-semibold py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking, index) => (
                    <TableRow key={booking.id} className={`border-neutral-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-primary/5`}>
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-neutral-900">{booking.guestName}</div>
                        <div className="text-xs text-neutral-600">{booking.guestEmail}</div>
                        <div className="text-xs text-neutral-600">{booking.guestContact}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-neutral-900">{booking.roomName}</div>
                        <div className="text-xs text-neutral-600">{booking.guestCount} Guests</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                          {format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1 whitespace-nowrap">
                          Req: {format(new Date(booking.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge variant="outline" className={`capitalize font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-md"
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
                                className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-md"
                                onClick={() => handleDecision(booking.id, "approve")}
                                disabled={decideBooking.isPending}
                                title="Approve"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-md"
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
        <DialogContent className="max-w-md border-primary/25 bg-white text-neutral-900">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Booking Details</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Ref: #{selectedBooking?.id.toString().padStart(4, '0')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500 block mb-1">Status</span>
                  <Badge variant="outline" className={`capitalize ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Room</span>
                  <span className="font-medium">{selectedBooking.roomName}</span>
                </div>
                
                <div>
                  <span className="text-neutral-500 block mb-1">Check-in</span>
                  <span className="font-medium">{format(new Date(selectedBooking.checkIn), "MMM d, yyyy")}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Check-out</span>
                  <span className="font-medium">{format(new Date(selectedBooking.checkOut), "MMM d, yyyy")}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-neutral-500 block mb-1">Guest Details</span>
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                    <div className="font-medium">{selectedBooking.guestName} ({selectedBooking.guestCount} Guests)</div>
                    <div className="text-neutral-700">{selectedBooking.guestEmail}</div>
                    <div className="text-neutral-700">{selectedBooking.guestContact}</div>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="col-span-2">
                    <span className="text-neutral-500 block mb-1">Special Requests</span>
                    <div className="rounded-md border-l-2 border-primary bg-amber-50 p-3 italic">
                      "{selectedBooking.specialRequests}"
                    </div>
                  </div>
                )}
                
                {selectedBooking.decidedAt && (
                  <div className="col-span-2 mt-2 border-t border-primary/15 pt-2 text-right text-xs text-neutral-500">
                    Decision made on: {format(new Date(selectedBooking.decidedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 sm:justify-between">
            <Button variant="ghost" onClick={() => setSelectedBooking(null)} className="text-neutral-700 hover:bg-neutral-100">
              Close
            </Button>
            
            {selectedBooking?.status === "pending" && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleDecision(selectedBooking.id, "reject");
                    setSelectedBooking(null);
                  }}
                  disabled={decideBooking.isPending}
                >
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 text-white hover:bg-green-700"
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
