import { useState, useEffect } from "react";
import { useAdminListBookings, getAdminListBookingsQueryKey, useAdminDecideBooking, useAdminConfirmCheckin, useAdminVoidBooking, getAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export default function AdminBookings() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "confirmed" | "voided">("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [voidReason, setVoidReason] = useState("");
  const [countdown, setCountdown] = useState<string>("");
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  
  const queryParams = filter === "all" ? {} : { status: filter };
  const { data: bookings = [], isLoading } = useAdminListBookings(queryParams, { 
    query: { queryKey: getAdminListBookingsQueryKey(queryParams) } 
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const decideBooking = useAdminDecideBooking();
  const confirmCheckin = useAdminConfirmCheckin();
  const voidBooking = useAdminVoidBooking();

  // Calculate countdown timer for approved bookings
  useEffect(() => {
    if (selectedBooking?.status !== "approved" || !selectedBooking?.approvedAt) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const approvedTime = new Date(selectedBooking.approvedAt).getTime();
      const expiryTime = approvedTime + EIGHT_HOURS_MS;
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setCountdown("Expired");
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedBooking]);

  const handleDecision = async (id: number, decision: "approve" | "reject") => {
    try {
      await decideBooking.mutateAsync({ id, data: { decision } });
      queryClient.invalidateQueries({ queryKey: getAdminListBookingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminListStatsQueryKey() });
      toast({ description: `Booking ${decision}d successfully.` });
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || `Failed to ${decision} booking.` });
    }
  };

  const handleConfirmCheckin = async (id: number) => {
    try {
      await confirmCheckin.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getAdminListBookingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminListStatsQueryKey() });
      toast({ description: "Check-in confirmed successfully." });
      setSelectedBooking(null);
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message });
    }
  };

  const handleVoidBooking = async (id: number, reason: string) => {
    if (!reason.trim()) {
      toast({ variant: "destructive", description: "Reason for voiding is required." });
      return;
    }
    try {
      await voidBooking.mutateAsync({ id, data: { reason } });
      queryClient.invalidateQueries({ queryKey: getAdminListBookingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminListStatsQueryKey() });
      toast({ description: "Booking voided successfully." });
      setSelectedBooking(null);
      setShowVoidDialog(false);
      setVoidReason("");
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-200";
      case "voided": return "bg-gray-50 text-gray-700 border-gray-200";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const isApprovalExpired = (approvedAt: string | null) => {
    if (!approvedAt) return false;
    const approvedTime = new Date(approvedAt).getTime();
    const expiryTime = approvedTime + EIGHT_HOURS_MS;
    return Date.now() > expiryTime;
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
          {["all", "pending", "approved", "confirmed", "rejected", "voided"].map((status) => (
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
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={`capitalize font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </Badge>
                          {booking.status === "approved" && booking.approvedAt && (
                            <span className={`text-xs font-medium ${isApprovalExpired(booking.approvedAt) ? "text-red-600" : "text-amber-600"}`}>
                              {isApprovalExpired(booking.approvedAt) ? "Expired" : "~8hr window"}
                            </span>
                          )}
                        </div>
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

                {selectedBooking.status === "approved" && selectedBooking.approvedAt && (
                  <div className="col-span-2">
                    <span className="text-neutral-500 block mb-1">Approval Window</span>
                    <div className={`rounded-md border-l-2 p-3 ${isApprovalExpired(selectedBooking.approvedAt) ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-sm">Countdown: {countdown || "Calculating..."}</span>
                      </div>
                      <span className="text-xs text-neutral-600">
                        Approved: {format(new Date(selectedBooking.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                )}

                {selectedBooking.voidedAt && (
                  <div className="col-span-2">
                    <span className="text-neutral-500 block mb-1">Voided</span>
                    <div className="rounded-md border-l-2 border-gray-300 bg-gray-50 p-3">
                      <div className="text-xs text-neutral-600 mb-1">
                        {format(new Date(selectedBooking.voidedAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      {selectedBooking.voidedReason && (
                        <div className="text-xs font-medium text-neutral-700">
                          Reason: {selectedBooking.voidedReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedBooking.decidedAt && !selectedBooking.voidedAt && (
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

            {selectedBooking?.status === "approved" && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setShowVoidDialog(true);
                  }}
                  disabled={isApprovalExpired(selectedBooking.approvedAt) || voidBooking.isPending}
                  title={isApprovalExpired(selectedBooking.approvedAt) ? "Approval window expired" : "Void Reservation"}
                >
                  Void Reservation
                </Button>
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleConfirmCheckin(selectedBooking.id)}
                  disabled={confirmCheckin.isPending}
                >
                  Confirm Check-in
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      {showVoidDialog && (
        <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
          <DialogContent className="max-w-sm border-primary/25 bg-white text-neutral-900">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Void Reservation</DialogTitle>
              <DialogDescription className="text-neutral-500">
                Ref: #{selectedBooking?.id.toString().padStart(4, '0')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="void-reason" className="text-neutral-700">
                  Reason for Voiding <span className="text-red-600">*</span>
                </Label>
                <textarea
                  id="void-reason"
                  className="mt-2 w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g., Client did not arrive within the 8-hour window"
                  rows={4}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowVoidDialog(false);
                  setVoidReason("");
                }}
                className="text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleVoidBooking(selectedBooking.id, voidReason)}
                disabled={!voidReason.trim()}
              >
                Void Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
