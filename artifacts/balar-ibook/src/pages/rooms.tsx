import { useListRooms, getListRoomsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import room1 from "/images/room-1.png";
import room2 from "/images/room-2.png";
import room3 from "/images/room-3.png";
import room4 from "/images/room-4.png";

const fallbackImages = [room1, room2, room3, room4];

export default function Rooms() {
  const { data: rooms = [], isLoading } = useListRooms({ query: { queryKey: getListRoomsQueryKey() } });

  return (
    <div className="min-h-screen bg-background pt-8 pb-24">
      <div className="container px-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Accommodations</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Discover our collection of thoughtfully designed rooms, each offering a unique blend of comfort, elegance, and modern amenities.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[500px] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room, index) => {
              const isFullyBooked = room.currentOccupied >= room.totalUnits;
              const percentOccupied = (room.currentOccupied / room.totalUnits) * 100;
              const img = room.imageUrl || fallbackImages[index % fallbackImages.length];

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden border-none shadow-lg group bg-card">
                    <div className="relative h-72 overflow-hidden">
                      <img 
                        src={img} 
                        alt={room.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur text-foreground px-4 py-2 rounded font-semibold shadow-md border border-primary/20">
                        ₱{room.price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-1">/night</span>
                      </div>
                    </div>
                    <CardContent className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-serif font-bold">{room.name}</h3>
                        <div className="flex items-center text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                          <Users className="w-4 h-4 mr-1.5" />
                          Max {room.capacity}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {room.description}
                      </p>
                      
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 text-foreground/80">Room Features</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {room.features.map((feature, i) => (
                            <div key={i} className="flex items-center text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground font-medium">Availability</span>
                          <span className={isFullyBooked ? "text-destructive font-bold" : "font-medium"}>
                            {room.totalUnits - room.currentOccupied} of {room.totalUnits} rooms left
                          </span>
                        </div>
                        <Progress value={percentOccupied} className={`h-2 ${isFullyBooked ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`} />
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      {isFullyBooked ? (
                        <Button disabled className="w-full uppercase tracking-wider font-semibold py-6">
                          Fully Booked
                        </Button>
                      ) : (
                        <Button asChild className="w-full uppercase tracking-wider font-semibold py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                          <Link href={`/book/${room.id}`}>Book This Room</Link>
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
  );
}
