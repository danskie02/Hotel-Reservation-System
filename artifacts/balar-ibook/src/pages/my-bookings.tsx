import { useListMyBookings, getListMyBookingsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MyBookings() {
  const { data: bookings = [], isLoading } = useListMyBookings({ query: { queryKey: getListMyBookingsQueryKey() } });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      case "rejected": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return <div className="container py-12"><div className="h-64 bg-muted animate-pulse rounded-lg" /></div>;
  }

  return (
    <div className="container max-w-5xl py-12 px-4 min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground text-lg">Manage and view your reservation history.</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent className="flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You haven't made any reservations. Discover our elegant rooms and book your stay today.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/rooms">Explore Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-none shadow-md">
              <div className="flex flex-col md:flex-row">
                <div className="bg-secondary/40 p-6 md:w-1/3 flex flex-col justify-center border-b md:border-b-0 md:border-r">
                  <Badge className={`w-fit mb-4 text-sm font-medium ${getStatusColor(booking.status)}`} variant="outline">
                    {getStatusLabel(booking.status)}
                  </Badge>
                  <h3 className="text-2xl font-serif font-bold mb-2">{booking.roomName}</h3>
                  <div className="text-sm text-muted-foreground mb-1">
                    Booking Ref: #{booking.id.toString().padStart(4, '0')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Requested on {format(new Date(booking.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                
                <div className="p-6 md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" /> Stay Dates
                      </div>
                      <div className="font-medium">
                        {format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center">
                        <Users className="w-4 h-4 mr-2" /> Guests
                      </div>
                      <div className="font-medium">{booking.guestCount} {booking.guestCount === 1 ? 'Person' : 'People'}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {booking.specialRequests && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Special Requests</div>
                        <div className="text-sm italic text-foreground/80 bg-secondary/20 p-3 rounded-md">
                          "{booking.specialRequests}"
                        </div>
                      </div>
                    )}
                    
                    {booking.decidedAt && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Decision Date</div>
                        <div className="font-medium text-sm">
                          {format(new Date(booking.decidedAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
