import { Router, type IRouter } from "express";
import { db, roomsTable, bookingsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

async function roomsWithOccupancy() {
  const rows = await db
    .select({
      id: roomsTable.id,
      name: roomsTable.name,
      description: roomsTable.description,
      price: roomsTable.price,
      capacity: roomsTable.capacity,
      totalUnits: roomsTable.totalUnits,
      imageUrl: roomsTable.imageUrl,
      features: roomsTable.features,
      occupied: sql<number>`COALESCE((SELECT COUNT(*)::int FROM ${bookingsTable} WHERE ${bookingsTable.roomId} = ${roomsTable.id} AND ${bookingsTable.status} = 'approved' AND ${bookingsTable.checkOut} >= CURRENT_DATE), 0)`,
    })
    .from(roomsTable)
    .orderBy(roomsTable.id);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    capacity: r.capacity,
    totalUnits: r.totalUnits,
    currentOccupied: Number(r.occupied) || 0,
    imageUrl: r.imageUrl,
    features: r.features ?? [],
  }));
}

router.get("/rooms", async (_req, res): Promise<void> => {
  const rooms = await roomsWithOccupancy();
  res.json(rooms);
});

router.get("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rooms = await roomsWithOccupancy();
  const room = rooms.find((r) => r.id === id);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(room);
});

export { roomsWithOccupancy };
export default router;
