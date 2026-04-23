import { Router, type IRouter } from "express";
import { db, bookingsTable, roomsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  AdminCreateRoomBody,
  AdminUpdateRoomBody,
  AdminDecideBookingBody,
} from "@workspace/api-zod";
import { requireUser } from "../lib/auth";
import { serializeBooking } from "./bookings";
import { roomsWithOccupancy } from "./rooms";
import { sendBookingDecisionEmail } from "../lib/notifications";

const router: IRouter = Router();
const uploadDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image uploads are allowed"));
  },
});

router.use(requireUser(true));

router.post("/admin/uploads/room-image", upload.single("image"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return;
  }

  res.json({ url: `/uploads/${req.file.filename}` });
});

router.get("/admin/bookings", async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : "all";
  const baseQuery = db
    .select({
      booking: bookingsTable,
      room: roomsTable,
      user: usersTable,
    })
    .from(bookingsTable)
    .leftJoin(roomsTable, eq(roomsTable.id, bookingsTable.roomId))
    .leftJoin(usersTable, eq(usersTable.id, bookingsTable.userId))
    .orderBy(desc(bookingsTable.createdAt));

  const rows =
    status && status !== "all"
      ? await baseQuery.where(eq(bookingsTable.status, status))
      : await baseQuery;

  res.json(rows.map(serializeBooking));
});

router.post("/admin/bookings/:id/decision", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = AdminDecideBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const newStatus = parsed.data.decision === "approve" ? "approved" : "rejected";
  const [updated] = await db
    .update(bookingsTable)
    .set({ status: newStatus, decidedAt: new Date() })
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, updated.roomId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));

  if (room && user) {
    await sendBookingDecisionEmail(newStatus, {
      guestName: user.fullName,
      guestEmail: user.email,
      roomName: room.name,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      guestCount: updated.guestCount,
      specialRequests: updated.specialRequests,
      bookingId: updated.id,
    });
  }

  res.json(serializeBooking({ booking: updated, room: room ?? null, user: user ?? null }));
});

router.get("/admin/rooms", async (_req, res): Promise<void> => {
  res.json(await roomsWithOccupancy());
});

router.post("/admin/rooms", async (req, res): Promise<void> => {
  const parsed = AdminCreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, price, capacity, totalUnits, imageUrl, features } = parsed.data;
  const [room] = await db
    .insert(roomsTable)
    .values({
      name,
      description,
      price: String(price),
      capacity,
      totalUnits,
      imageUrl,
      features,
    })
    .returning();
  if (!room) {
    res.status(500).json({ error: "Failed to create room" });
    return;
  }
  res.json({
    id: room.id,
    name: room.name,
    description: room.description,
    price: Number(room.price),
    capacity: room.capacity,
    totalUnits: room.totalUnits,
    currentOccupied: 0,
    imageUrl: room.imageUrl,
    features: room.features ?? [],
  });
});

router.patch("/admin/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = AdminUpdateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (k === "price") update[k] = String(v);
    else update[k] = v;
  }
  const [room] = await db
    .update(roomsTable)
    .set(update)
    .where(eq(roomsTable.id, id))
    .returning();
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  const list = await roomsWithOccupancy();
  const enriched = list.find((r) => r.id === id);
  res.json(enriched);
});

router.get("/admin/users", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      contactNumber: usersTable.contactNumber,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      bookingCount: sql<number>`COALESCE((SELECT COUNT(*)::int FROM ${bookingsTable} WHERE ${bookingsTable.userId} = ${usersTable.id} AND ${bookingsTable.status} IN ('pending', 'approved')), 0)`,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      contactNumber: r.contactNumber,
      role: r.role,
      createdAt: r.createdAt.toISOString(),
      bookingCount: Number(r.bookingCount) || 0,
    })),
  );
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [counts] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'pending')::int`,
      approved: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'approved')::int`,
      rejected: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'rejected')::int`,
    })
    .from(bookingsTable);

  const [guestCount] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "guest"));

  const [roomTotals] = await db
    .select({
      totalRooms: sql<number>`COUNT(*)::int`,
      totalUnits: sql<number>`COALESCE(SUM(${roomsTable.totalUnits}), 0)::int`,
    })
    .from(roomsTable);

  const [occ] = await db
    .select({
      occupiedUnits: sql<number>`COUNT(*)::int`,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "approved"),
        sql`${bookingsTable.checkOut} >= CURRENT_DATE`,
      ),
    );

  res.json({
    totalBookings: Number(counts?.total) || 0,
    pendingBookings: Number(counts?.pending) || 0,
    approvedBookings: Number(counts?.approved) || 0,
    rejectedBookings: Number(counts?.rejected) || 0,
    totalGuests: Number(guestCount?.c) || 0,
    totalRooms: Number(roomTotals?.totalRooms) || 0,
    totalUnits: Number(roomTotals?.totalUnits) || 0,
    occupiedUnits: Number(occ?.occupiedUnits) || 0,
  });
});

router.get("/admin/occupancy", async (_req, res): Promise<void> => {
  const rooms = await roomsWithOccupancy();
  res.json(
    rooms.map((r) => ({
      roomId: r.id,
      roomName: r.name,
      totalUnits: r.totalUnits,
      occupied: r.currentOccupied,
      available: Math.max(0, r.totalUnits - r.currentOccupied),
    })),
  );
});

router.get("/admin/recent-activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      booking: bookingsTable,
      room: roomsTable,
      user: usersTable,
    })
    .from(bookingsTable)
    .leftJoin(roomsTable, eq(roomsTable.id, bookingsTable.roomId))
    .leftJoin(usersTable, eq(usersTable.id, bookingsTable.userId))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(10);
  res.json(rows.map(serializeBooking));
});

export default router;
