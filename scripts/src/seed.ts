import bcrypt from "bcryptjs";
import { db, usersTable, roomsTable, bookingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  const counts = await db.select({ c: sql<number>`COUNT(*)::int` }).from(roomsTable);
  if ((counts[0]?.c ?? 0) > 0) {
    console.log("Seed: rooms already exist, skipping");
    process.exit(0);
  }

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

  const rooms = await db
    .insert(roomsTable)
    .values([
      {
        name: "Standard Room",
        description:
          "A comfortable and cozy room perfect for solo travelers or couples. Features a queen-size bed, modern bathroom, air conditioning, and complimentary Wi-Fi.",
        price: "2800",
        capacity: 2,
        totalUnits: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
        features: ["Queen-size bed", "Air conditioning", "Free Wi-Fi", "Cable TV", "Modern bathroom"],
      },
      {
        name: "Deluxe Room",
        description:
          "Spacious and elegantly designed room with enhanced amenities. Includes a king-size bed, premium bedding, workspace, and stunning views of the Marinduque coast.",
        price: "4500",
        capacity: 3,
        totalUnits: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
        features: ["King-size bed", "Premium bedding", "Work desk", "Mini fridge", "Coffee maker", "Sea view"],
      },
      {
        name: "Family Suite",
        description:
          "Generous suite ideal for families. Two bedrooms, a living area, and a private balcony overlooking the gardens.",
        price: "7500",
        capacity: 5,
        totalUnits: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
        features: ["Two bedrooms", "Living area", "Private balcony", "Mini bar", "Bathtub", "Garden view"],
      },
      {
        name: "Premier Suite",
        description:
          "Our flagship suite offers the ultimate in luxury hospitality. Includes a master bedroom, living room, dining nook, and a private terrace with ocean views.",
        price: "12000",
        capacity: 4,
        totalUnits: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
        features: ["Master bedroom", "Living room", "Dining nook", "Private terrace", "Ocean view", "Premium toiletries"],
      },
    ])
    .returning();

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

  console.log("Seed complete:");
  console.log("  Admin:  admin@balarhotel.com / Admin#2026");
  console.log("  Guest:  maria@example.com / Guest#2026");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
