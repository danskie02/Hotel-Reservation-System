import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull(),
  totalUnits: integer("total_units").notNull(),
  imageUrl: text("image_url").notNull(),
  features: text("features").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Room = typeof roomsTable.$inferSelect;
