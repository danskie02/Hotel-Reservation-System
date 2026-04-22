-- =============================================================
-- Balar iBOOK — Database Schema & Seed Data
-- Online Reservation and Booking Management System for Balar Hotel
-- Target: PostgreSQL 14+
--
-- This file recreates the application database from scratch.
-- It is suitable for first-time deployment on Render or any
-- Postgres host, and matches the Drizzle schema used by the app.
--
-- Default accounts seeded below:
--   Admin: admin@balarhotel.com   /  Admin#2026
--   Guest: maria@example.com      /  Guest#2026
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- Clean slate (safe re-run)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "rooms"    CASCADE;
DROP TABLE IF EXISTS "users"    CASCADE;

-- -------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------

-- Users (guests + administrators)
CREATE TABLE "users" (
    "id"              SERIAL PRIMARY KEY,
    "full_name"       TEXT        NOT NULL,
    "email"           TEXT        NOT NULL UNIQUE,
    "contact_number"  TEXT        NOT NULL,
    "password_hash"   TEXT        NOT NULL,
    "role"            TEXT        NOT NULL DEFAULT 'guest'
        CHECK ("role" IN ('guest', 'admin')),
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "users_email_idx" ON "users" ("email");

-- Rooms (hotel inventory)
CREATE TABLE "rooms" (
    "id"           SERIAL PRIMARY KEY,
    "name"         TEXT          NOT NULL,
    "description"  TEXT          NOT NULL,
    "price"        NUMERIC(10,2) NOT NULL,
    "capacity"     INTEGER       NOT NULL,
    "total_units"  INTEGER       NOT NULL,
    "image_url"    TEXT          NOT NULL,
    "features"     TEXT[]        NOT NULL DEFAULT '{}',
    "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Bookings (reservation requests)
CREATE TABLE "bookings" (
    "id"                SERIAL PRIMARY KEY,
    "user_id"           INTEGER     NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "room_id"           INTEGER     NOT NULL REFERENCES "rooms" ("id") ON DELETE CASCADE,
    "check_in"          DATE        NOT NULL,
    "check_out"         DATE        NOT NULL,
    "guest_count"       INTEGER     NOT NULL,
    "special_requests"  TEXT,
    "status"            TEXT        NOT NULL DEFAULT 'pending'
        CHECK ("status" IN ('pending', 'approved', 'rejected')),
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "decided_at"        TIMESTAMPTZ,
    CONSTRAINT "bookings_dates_chk" CHECK ("check_out" > "check_in")
);

CREATE INDEX "bookings_user_id_idx" ON "bookings" ("user_id");
CREATE INDEX "bookings_room_id_idx" ON "bookings" ("room_id");
CREATE INDEX "bookings_status_idx"  ON "bookings" ("status");

-- =============================================================
-- Seed Data
-- =============================================================

-- Users -------------------------------------------------------
-- Password hashes are bcrypt ($2b$10$...) for the listed passwords.
INSERT INTO "users" ("full_name", "email", "contact_number", "password_hash", "role") VALUES
    ('Hotel Administrator', 'admin@balarhotel.com', '+63 912 345 6789',
     '$2a$10$1q4vh7t9HhGq.0R.1m0fmuYHjHFUTBV3p9O8hkRR8FjwM9eMbjgL.', 'admin'),
    ('Maria Santos',        'maria@example.com',    '+63 917 111 2233',
     '$2a$10$D6Z2u5d/3K6uWfPS1Y3rZeC5R2dA5p8N0Z9m9aQ6nM3JwQdb6n7Tu', 'guest'),
    ('Juan Dela Cruz',      'juan@example.com',     '+63 918 222 3344',
     '$2a$10$D6Z2u5d/3K6uWfPS1Y3rZeC5R2dA5p8N0Z9m9aQ6nM3JwQdb6n7Tu', 'guest'),
    ('Ana Reyes',           'ana@example.com',      '+63 919 333 4455',
     '$2a$10$D6Z2u5d/3K6uWfPS1Y3rZeC5R2dA5p8N0Z9m9aQ6nM3JwQdb6n7Tu', 'guest');

-- Rooms -------------------------------------------------------
INSERT INTO "rooms" ("name", "description", "price", "capacity", "total_units", "image_url", "features") VALUES
    ('Standard Room',
     'A comfortable and cozy room perfect for solo travelers or couples. Features a queen-size bed, modern bathroom, air conditioning, and complimentary Wi-Fi.',
     2800.00, 2, 5,
     'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
     ARRAY['Queen-size bed', 'Air conditioning', 'Free Wi-Fi', 'Cable TV', 'Modern bathroom']),

    ('Deluxe Room',
     'Spacious and elegantly designed room with enhanced amenities. Includes a king-size bed, premium bedding, workspace, and stunning views of the Marinduque coast.',
     4500.00, 3, 4,
     'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
     ARRAY['King-size bed', 'Premium bedding', 'Work desk', 'Mini fridge', 'Coffee maker', 'Sea view']),

    ('Family Suite',
     'Generous suite ideal for families. Two bedrooms, a living area, and a private balcony overlooking the gardens.',
     7500.00, 5, 3,
     'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
     ARRAY['Two bedrooms', 'Living area', 'Private balcony', 'Mini bar', 'Bathtub', 'Garden view']),

    ('Premier Suite',
     'Our flagship suite offers the ultimate in luxury hospitality. Includes a master bedroom, living room, dining nook, and a private terrace with ocean views.',
     12000.00, 4, 2,
     'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
     ARRAY['Master bedroom', 'Living room', 'Dining nook', 'Private terrace', 'Ocean view', 'Premium toiletries']);

-- Bookings ----------------------------------------------------
INSERT INTO "bookings" ("user_id", "room_id", "check_in", "check_out", "guest_count", "special_requests", "status", "decided_at") VALUES
    ((SELECT id FROM users WHERE email='maria@example.com'),
     (SELECT id FROM rooms WHERE name='Standard Room'),
     '2026-05-01', '2026-05-04', 2,
     'Late check-in around 9 PM, please.',
     'pending', NULL),

    ((SELECT id FROM users WHERE email='maria@example.com'),
     (SELECT id FROM rooms WHERE name='Deluxe Room'),
     '2026-06-10', '2026-06-14', 2,
     'Anniversary stay - flowers if possible.',
     'approved', NOW()),

    ((SELECT id FROM users WHERE email='juan@example.com'),
     (SELECT id FROM rooms WHERE name='Family Suite'),
     '2026-04-25', '2026-04-28', 4,
     'Need an extra crib for a toddler.',
     'pending', NULL),

    ((SELECT id FROM users WHERE email='ana@example.com'),
     (SELECT id FROM rooms WHERE name='Premier Suite'),
     '2026-07-15', '2026-07-20', 2,
     'Honeymoon celebration.',
     'approved', NOW()),

    ((SELECT id FROM users WHERE email='ana@example.com'),
     (SELECT id FROM rooms WHERE name='Standard Room'),
     '2026-03-05', '2026-03-07', 1,
     NULL,
     'rejected', NOW());

COMMIT;

-- =============================================================
-- Done.
-- =============================================================
