import { Router, type IRouter } from "express";
import { db, bookingsTable, roomsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateBookingBody } from "@workspace/api-zod";
import { requireUser, getCurrentUser } from "../lib/auth";

const router: IRouter = Router();

function toIsoDate(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString();
}

function serializeBooking(row: {
  booking: typeof bookingsTable.$inferSelect;
  room: typeof roomsTable.$inferSelect | null;
  user: typeof usersTable.$inferSelect | null;
}) {
  const { booking, room, user } = row;
  return {
    id: booking.id,
    roomId: booking.roomId,
    roomName: room?.name ?? "",
    userId: booking.userId,
    guestName: user?.fullName ?? "",
    guestEmail: user?.email ?? "",
    guestContact: user?.contactNumber ?? "",
    checkIn: toIsoDate(booking.checkIn),
    checkOut: toIsoDate(booking.checkOut),
    guestCount: booking.guestCount,
    specialRequests: booking.specialRequests,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    decidedAt: booking.decidedAt ? booking.decidedAt.toISOString() : null,
  };
}

router.post("/bookings", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to book" });
    return;
  }
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { roomId, checkIn, checkOut, guestCount, specialRequests } = parsed.data;

  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn as unknown as string);
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut as unknown as string);
  if (checkOutDate <= checkInDate) {
    res.status(400).json({ error: "Check-out must be after check-in" });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).limit(1);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      userId: user.id,
      roomId,
      checkIn: checkInDate.toISOString().slice(0, 10),
      checkOut: checkOutDate.toISOString().slice(0, 10),
      guestCount,
      specialRequests: specialRequests ?? null,
      status: "pending",
    })
    .returning();
  if (!booking) {
    res.status(500).json({ error: "Failed to create booking" });
    return;
  }

  res.json(serializeBooking({ booking, room, user }));
});

router.get("/bookings/mine", requireUser(), async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const rows = await db
    .select({
      booking: bookingsTable,
      room: roomsTable,
      user: usersTable,
    })
    .from(bookingsTable)
    .leftJoin(roomsTable, eq(roomsTable.id, bookingsTable.roomId))
    .leftJoin(usersTable, eq(usersTable.id, bookingsTable.userId))
    .where(eq(bookingsTable.userId, user.id))
    .orderBy(desc(bookingsTable.createdAt));
  res.json(rows.map(serializeBooking));
});

export { serializeBooking };
export default router;
