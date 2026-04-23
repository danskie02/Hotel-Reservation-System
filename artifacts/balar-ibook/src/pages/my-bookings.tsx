import { useListMyBookings, getListMyBookingsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Home, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import room1 from "/images/room-1.png";
import room2 from "/images/room-2.png";
import room3 from "/images/room-3.png";
import room4 from "/images/room-4.png";

const fallbackImages = [room1, room2, room3, room4];

export default function MyBookings() {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return apiBaseUrl ? `${apiBaseUrl}${url}` : url;
    return url;
  };

  const { data: bookings = [], isLoading } = useListMyBookings({ query: { queryKey: getListMyBookingsQueryKey() } });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return <div className="container py-12"><div className="h-64 bg-muted animate-pulse rounded-lg" /></div>;
  }

  return (
    <div className="container max-w-6xl py-12 px-4 min-h-screen bg-white">
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold mb-2 text-neutral-900">My Bookings</h1>
        <p className="text-neutral-600 text-lg">Manage and view your reservation history.</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2">
          <CardContent className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2 text-neutral-900">No bookings yet</h3>
            <p className="text-neutral-600 mb-6 max-w-sm">
              You haven't made any reservations. Discover our elegant rooms and book your stay today.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/rooms">Explore Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking, index) => {
            const fallbackImage = fallbackImages[index % fallbackImages.length];
            const img = booking.roomImage ? resolveImageUrl(booking.roomImage) : fallbackImage;
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-2 border-primary/20 shadow-md hover:shadow-lg hover:border-primary/40 transition-all group">
                  <div className="grid md:grid-cols-[1fr_2fr] gap-0">
                    {/* Image Section */}
                    <div className="relative h-64 md:h-auto overflow-hidden bg-neutral-100">
                      <img
                        src={img}
                        alt={booking.roomName}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage;
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className={`absolute top-4 left-4 text-sm font-semibold shadow-md ${getStatusColor(booking.status)}`} variant="outline">
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-2">{booking.roomName}</h3>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <div>Booking Ref: <span className="font-semibold text-primary">#{booking.id.toString().padStart(4, '0')}</span></div>
                          <div>Requested on {format(new Date(booking.createdAt), "MMM d, yyyy")}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-primary/10">
                        {/* Stay Dates */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Check-in</p>
                            <p className="text-lg font-bold text-neutral-900">{format(new Date(booking.checkIn), "MMM d, yyyy")}</p>
                          </div>
                        </div>

                        {/* Checkout Date */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Check-out</p>
                            <p className="text-lg font-bold text-neutral-900">{format(new Date(booking.checkOut), "MMM d, yyyy")}</p>
                          </div>
                        </div>

                        {/* Guest Count */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Guests</p>
                            <p className="text-lg font-bold text-neutral-900">{booking.guestCount} {booking.guestCount === 1 ? 'Person' : 'People'}</p>
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Duration</p>
                            <p className="text-lg font-bold text-neutral-900">{Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} Night{Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>

                      {/* Special Requests and Decision Date */}
                      <div className="space-y-4">
                        {booking.specialRequests && (
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-2">Special Requests</p>
                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm italic text-neutral-700">
                              "{booking.specialRequests}"
                            </div>
                          </div>
                        )}
                        
                        {booking.decidedAt && (
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-2">Decision Date</p>
                            <p className="text-sm text-neutral-700">
                              {format(new Date(booking.decidedAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
