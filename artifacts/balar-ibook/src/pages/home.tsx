import { useListRooms, getListRoomsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Star,
  Coffee,
  Wifi,
  Waves,
  Users,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "/images/hero-bg.png";
import room1 from "/images/room-1.png";
import room2 from "/images/room-2.png";
import room3 from "/images/room-3.png";
import room4 from "/images/room-4.png";

const fallbackImages = [room1, room2, room3, room4];

export default function Home() {
  const { data: rooms = [], isLoading } = useListRooms({
    query: { queryKey: getListRoomsQueryKey() },
  });

  const scrollToRooms = () => {
    document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf7ee]">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Balar Hotel Exterior"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative z-10 container text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block uppercase tracking-[0.4em] text-primary text-xs md:text-sm mb-6">
              Boac · Marinduque · Philippines
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4 text-primary">
              BALAR iBOOK
            </h1>
            <p className="text-lg md:text-2xl max-w-2xl mx-auto text-gray-200 mb-8 font-light">
              A sanctuary where elegance meets the sea. Experience luxury and
              tropical hospitality on the shores of Marinduque.
            </p>
            <Button
              size="lg"
              onClick={scrollToRooms}
              className="text-lg px-8 py-6 rounded-none uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Book Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About Section — dark frame */}
      <section className="py-24 bg-black text-white">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl border border-primary/30 bg-neutral-950 p-10 md:p-16 shadow-2xl">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-primary">
                Welcome to Paradise
              </h2>
              <div className="w-16 h-[2px] bg-primary mx-auto mb-8" />
              <p className="text-gray-300 leading-relaxed text-lg max-w-3xl mx-auto">
                Nestled along the pristine coastline of Boac, Balar Hotel & Spa
                offers an unparalleled escape from the everyday. Our
                meticulously designed rooms and world-class amenities ensure a
                stay that is both rejuvenating and memorable. Whether you're
                seeking a romantic getaway or a tranquil retreat, our warm
                hospitality and breathtaking views await.
              </p>
              <div className="grid grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
                {[
                  { value: "37", label: "Curated Rooms" },
                  { value: "7", label: "Room Categories" },
                  { value: "24/7", label: "Concierge Care" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-primary/20 bg-black/40 p-4"
                  >
                    <div className="text-3xl font-serif font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Showcase — cream framed panel */}
      <section id="rooms" className="py-24 bg-[#fbf7ee]">
        <div className="container px-4">
          <div className="mx-auto max-w-7xl border-2 border-primary/30 bg-white p-8 md:p-12 shadow-lg">
            <div className="text-center mb-12">
              <span className="inline-block uppercase tracking-[0.4em] text-primary text-xs mb-3">
                Stay
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
                Our Accommodations
              </h2>
              <div className="w-16 h-[2px] bg-primary mx-auto mb-4" />
              <p className="text-muted-foreground max-w-xl mx-auto">
                Select from our range of luxurious rooms designed for your
                ultimate comfort.
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.slice(0, 6).map((room, index) => {
                  const isFullyBooked =
                    room.currentOccupied >= room.totalUnits;
                  const percentOccupied =
                    (room.currentOccupied / room.totalUnits) * 100;
                  const img =
                    room.imageUrl ||
                    fallbackImages[index % fallbackImages.length];

                  return (
                    <motion.div
                      key={room.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full flex flex-col overflow-hidden border border-neutral-200 shadow-md hover:shadow-xl transition-shadow group bg-white">
                        <div className="relative h-64 overflow-hidden">
                          <img
                            src={img}
                            alt={room.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-4 right-4 bg-black text-primary px-3 py-1 font-semibold shadow-md border border-primary/40">
                            ₱{room.price.toLocaleString()}
                            <span className="text-xs font-normal text-gray-300">
                              /night
                            </span>
                          </div>
                        </div>
                        <CardContent className="flex-1 p-6 bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-serif font-bold">
                              {room.name}
                            </h3>
                            <div className="flex items-center text-xs text-foreground bg-primary/15 px-2 py-1 rounded">
                              <Users className="w-4 h-4 mr-1" />
                              Up to {room.capacity}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                            {room.description}
                          </p>
                          <div className="space-y-2 mb-6">
                            {room.features.slice(0, 3).map((feature, i) => (
                              <div
                                key={i}
                                className="flex items-center text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                                <span className="truncate">{feature}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto pt-4 border-t border-neutral-200">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                Availability
                              </span>
                              <span className="font-medium">
                                {room.totalUnits - room.currentOccupied} of{" "}
                                {room.totalUnits} left
                              </span>
                            </div>
                            <Progress value={percentOccupied} className="h-2" />
                          </div>
                        </CardContent>
                        <CardFooter className="p-6 pt-0 bg-white">
                          {isFullyBooked ? (
                            <Button
                              disabled
                              className="w-full uppercase tracking-wider"
                            >
                              Fully Booked
                            </Button>
                          ) : (
                            <Button
                              asChild
                              className="w-full uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Link href={`/book/${room.id}`}>Book Now</Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-12">
              <Button
                variant="outline"
                asChild
                className="uppercase tracking-wider border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <Link href="/rooms">View All Rooms</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section — yellow tinted band with dark cards */}
      <section className="py-24 bg-[#1a1a1a] text-white">
        <div className="container px-4">
          <div className="text-center mb-14">
            <span className="inline-block uppercase tracking-[0.4em] text-primary text-xs mb-3">
              Comfort
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-primary">
              World-Class Amenities
            </h2>
            <div className="w-16 h-[2px] bg-primary mx-auto mb-4" />
            <p className="text-gray-400">
              Everything you need for an unforgettable stay.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Waves, title: "Infinity Pool", desc: "Ocean views" },
              { icon: Star, title: "Luxury Spa", desc: "Rejuvenating treatments" },
              { icon: Coffee, title: "Fine Dining", desc: "Local & international cuisine" },
              { icon: Wifi, title: "High-Speed WiFi", desc: "Complimentary access" },
            ].map((amenity, i) => (
              <div
                key={i}
                className="text-center p-8 border border-primary/30 bg-black hover:bg-neutral-900 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 text-primary mb-4 border border-primary/30">
                  <amenity.icon className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold mb-2 text-primary">
                  {amenity.title}
                </h3>
                <p className="text-sm text-gray-400">{amenity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section — cream framed against dark */}
      <section className="py-24 bg-[#fbf7ee]">
        <div className="container px-4">
          <div className="mx-auto max-w-6xl border-2 border-primary/30 bg-black text-white p-8 md:p-12 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block uppercase tracking-[0.4em] text-primary text-xs mb-3">
                  Visit
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-primary">
                  Find Us
                </h2>
                <div className="w-16 h-[2px] bg-primary mb-6" />
                <p className="text-gray-300 mb-8 text-lg">
                  Located in the heart of Boac, Marinduque, Balar Hotel is
                  easily accessible while offering a secluded atmosphere away
                  from the bustle.
                </p>
                <div className="space-y-5">
                  <div className="flex items-start border border-primary/20 bg-neutral-950 p-4">
                    <MapPin className="w-6 h-6 text-primary mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-base text-primary">
                        Address
                      </h4>
                      <p className="text-gray-400 text-sm">
                        Boac, Marinduque, Philippines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start border border-primary/20 bg-neutral-950 p-4">
                    <Phone className="w-6 h-6 text-primary mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-base text-primary">
                        Phone
                      </h4>
                      <p className="text-gray-400 text-sm">
                        +63 (123) 456-7890
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start border border-primary/20 bg-neutral-950 p-4">
                    <Mail className="w-6 h-6 text-primary mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-base text-primary">
                        Email
                      </h4>
                      <p className="text-gray-400 text-sm">
                        info@balarhotel.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-96 overflow-hidden border border-primary/30">
                <div className="w-full h-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000')] bg-cover bg-center">
                  <div className="bg-black/85 p-6 backdrop-blur text-center border border-primary/40">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h3 className="font-serif text-xl text-primary">
                      Balar Hotel
                    </h3>
                    <p className="text-gray-400 text-sm">Boac, Marinduque</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
