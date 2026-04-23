import { useListRooms, getListRoomsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2, BedDouble } from "lucide-react";
import { motion } from "framer-motion";
import room1 from "/images/room-1.png";
import room2 from "/images/room-2.png";
import room3 from "/images/room-3.png";
import room4 from "/images/room-4.png";

const fallbackImages = [room1, room2, room3, room4];

export default function Rooms() {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return apiBaseUrl ? `${apiBaseUrl}${url}` : url;
    return url;
  };

  const { data: rooms = [], isLoading } = useListRooms({
    query: { queryKey: getListRoomsQueryKey() },
  });

  const totalUnits = rooms.reduce((s, r) => s + r.totalUnits, 0);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container px-4">
        {/* Page header — framed black banner */}
        <div className="mx-auto max-w-7xl border-2 border-primary/40 bg-black text-white p-8 md:p-12 mb-12 shadow-md">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="inline-block uppercase tracking-[0.4em] text-primary text-xs mb-3">
                Stay With Us
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-primary">
                Our Accommodations
              </h1>
              <div className="w-16 h-[2px] bg-primary mb-4" />
              <p className="text-gray-300 text-base max-w-2xl">
                Discover our collection of thoughtfully designed rooms, each
                offering a unique blend of comfort, elegance, and modern
                amenities.
              </p>
            </div>
            <div className="flex items-center gap-3 border border-primary/40 bg-neutral-950 px-5 py-3">
              <BedDouble className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xl font-serif font-bold text-primary">
                  {rooms.length || 7} Categories · {totalUnits || 37} Rooms
                </div>
                <div className="text-xs uppercase tracking-widest text-gray-400">
                  Available Inventory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms grid — framed white panel */}
        <div className="mx-auto max-w-7xl border-2 border-primary/40 bg-white p-6 md:p-10 shadow-md">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-[500px] bg-muted animate-pulse rounded"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room, index) => {
                const isFullyBooked = room.currentOccupied >= room.totalUnits;
                const percentOccupied =
                  (room.currentOccupied / room.totalUnits) * 100;
                const fallbackImage = fallbackImages[index % fallbackImages.length];
                const img = room.imageUrl ? resolveImageUrl(room.imageUrl) : fallbackImage;

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden border-2 border-primary/30 hover:border-primary shadow-md hover:shadow-2xl transition-all group bg-white">
                      <div className="relative h-72 overflow-hidden border-b-2 border-primary/30">
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
                        {isFullyBooked && (
                          <div className="absolute top-4 left-4 bg-destructive text-white px-3 py-1 text-xs uppercase tracking-widest font-bold">
                            Fully Booked
                          </div>
                        )}
                      </div>

                      <CardContent className="flex-1 p-6 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-2xl font-serif font-bold">
                            {room.name}
                          </h3>
                          <div className="flex items-center text-sm font-medium text-foreground bg-primary/15 border border-primary/30 px-3 py-1">
                            <Users className="w-4 h-4 mr-1.5" />
                            Max {room.capacity}
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {room.description}
                        </p>

                        <div className="mb-6 border border-primary/20 bg-primary/5 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 text-primary">
                            Room Features
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {room.features.map((feature, i) => (
                              <div
                                key={i}
                                className="flex items-center text-sm text-foreground"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                                <span className="truncate">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t-2 border-primary/20">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-xs">
                              Availability
                            </span>
                            <span
                              className={
                                isFullyBooked
                                  ? "text-destructive font-bold"
                                  : "font-bold text-foreground"
                              }
                            >
                              {room.totalUnits - room.currentOccupied} of{" "}
                              {room.totalUnits} left
                            </span>
                          </div>
                          <Progress
                            value={percentOccupied}
                            className={`h-2 ${
                              isFullyBooked
                                ? "[&>div]:bg-destructive"
                                : "[&>div]:bg-primary"
                            }`}
                          />
                        </div>
                      </CardContent>

                      <CardFooter className="p-6 pt-0 bg-white">
                        {isFullyBooked ? (
                          <Button
                            disabled
                            className="w-full uppercase tracking-wider font-semibold py-6"
                          >
                            Fully Booked
                          </Button>
                        ) : (
                          <Button
                            asChild
                            className="w-full uppercase tracking-wider font-semibold py-6 bg-black hover:bg-primary hover:text-primary-foreground text-primary border border-primary transition-all"
                          >
                            <Link href={`/book/${room.id}`}>
                              Book This Room
                            </Link>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
