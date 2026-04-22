import bcrypt from "bcryptjs";
import { db, usersTable, roomsTable, bookingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const ROOMS = [
  {
    name: "Standard Room",
    description:
      "A comfortable and well-appointed room ideal for solo travelers and couples. Features a queen-size bed, modern bathroom, air conditioning, and complimentary Wi-Fi.",
    price: "2800",
    capacity: 2,
    totalUnits: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
    features: ["Queen-size bed", "Air conditioning", "Free Wi-Fi", "Cable TV", "Hot & cold shower"],
  },
  {
    name: "Deluxe Room",
    description:
      "Spacious and elegantly furnished room with enhanced amenities. Includes a king-size bed, premium bedding, work desk, and refined finishes throughout.",
    price: "4200",
    capacity: 3,
    totalUnits: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    features: ["King-size bed", "Premium bedding", "Work desk", "Mini fridge", "Coffee maker", "Smart TV"],
  },
  {
    name: "Superior Quadruple Room",
    description:
      "Generously sized room designed for groups of four. Two double beds, a comfortable lounge corner, and ample storage make group stays effortless.",
    price: "5500",
    capacity: 4,
    totalUnits: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    features: ["Two double beds", "Lounge corner", "Air conditioning", "Smart TV", "Spacious bath"],
  },
  {
    name: "Premier Quadruple Room",
    description:
      "An upgraded quadruple option with premium furnishings, larger windows, and refined amenities for groups seeking a more luxurious stay.",
    price: "6800",
    capacity: 4,
    totalUnits: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    features: ["Two queen beds", "Premium linens", "Mini bar", "Bathtub", "City or garden view"],
  },
  {
    name: "Executive Suite",
    description:
      "Sophisticated suite with a separate sitting area, ideal for business travelers and discerning guests. Includes a king-size bed and executive workspace.",
    price: "9500",
    capacity: 3,
    totalUnits: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
    features: ["King-size bed", "Separate sitting area", "Executive desk", "Premium toiletries", "Espresso machine", "Bathtub"],
  },
  {
    name: "Premium Room",
    description:
      "Our top-tier room category featuring the finest furnishings, plush bedding, and a serene atmosphere for an unforgettable stay.",
    price: "7500",
    capacity: 2,
    totalUnits: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    features: ["King-size bed", "Plush bedding", "Rain shower", "Mini bar", "Premium view"],
  },
  {
    name: "Family Room",
    description:
      "Thoughtfully designed for families. Two bedrooms, a shared living space, and child-friendly amenities ensure a relaxing stay for all ages.",
    price: "8800",
    capacity: 5,
    totalUnits: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    features: ["Two bedrooms", "Living area", "Family bathroom", "Mini fridge", "Smart TV", "Garden view"],
  },
];

async function main() {
  // Always reseed: clear existing data
  await db.delete(bookingsTable);
  await db.delete(roomsTable);
  await db.delete(usersTable);

  const adminHash = await bcrypt.hash("Admin#2026", 10);
  const guestHash = await bcrypt.hash("Guest#2026", 10);

  const [admin] = await db
    .insert(usersTable)
    .values({
      fullName: "Hotel Administrator",
      email: "admin@balarhotel.com",
      contactNumber: "+63 912 345 6789",
      passwordHash: adminHash,
      role: "admin",
    })
    .returning();

  const [guest] = await db
    .insert(usersTable)
    .values({
      fullName: "Maria Santos",
      email: "maria@example.com",
      contactNumber: "+63 917 111 2233",
      passwordHash: guestHash,
      role: "guest",
    })
    .returning();

  const rooms = await db.insert(roomsTable).values(ROOMS).returning();

  const standard = rooms.find((r) => r.name === "Standard Room");
  const deluxe = rooms.find((r) => r.name === "Deluxe Room");

  if (guest && standard && deluxe) {
    await db.insert(bookingsTable).values([
      {
        userId: guest.id,
        roomId: standard.id,
        checkIn: "2026-05-01",
        checkOut: "2026-05-04",
        guestCount: 2,
        specialRequests: "Late check-in around 9 PM, please.",
        status: "pending",
      },
      {
        userId: guest.id,
        roomId: deluxe.id,
        checkIn: "2026-06-10",
        checkOut: "2026-06-14",
        guestCount: 2,
        specialRequests: "Anniversary stay - flowers if possible.",
        status: "approved",
        decidedAt: new Date(),
      },
    ]);
  }

  const totalUnits = ROOMS.reduce((s, r) => s + r.totalUnits, 0);
  console.log(`Seed complete: ${ROOMS.length} room types, ${totalUnits} total rooms.`);
  console.log("  Admin:  admin@balarhotel.com / Admin#2026");
  console.log("  Guest:  maria@example.com / Guest#2026");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
