import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "travel_tours.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

// Safe bootstrap: create tables if missing, never run destructive DROP statements at startup.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    birth_date TEXT,
    is_admin INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_per_night REAL NOT NULL,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    max_guests INTEGER DEFAULT 2,
    bed_count INTEGER DEFAULT 1,
    bath_count INTEGER DEFAULT 1,
    amenities TEXT,
    booking_options TEXT,
    accessibility TEXT,
    host_languages TEXT,
    room_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INTEGER NOT NULL,
    num_adults INTEGER DEFAULT 1,
    num_children INTEGER DEFAULT 0,
    num_infants INTEGER DEFAULT 0,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add 'status' column to existing 'bookings' table if it doesn't exist
try {
  db.exec("ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending'");
} catch (error) {
  // If the error is not about the column already existing, re-throw it
  if (!error.message.includes("duplicate column name")) {
    console.error("Error adding status column:", error);
  }
}

db.exec(`

  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    UNIQUE(user_id, room_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    avatar_url TEXT,
    comment TEXT,
    cleanliness REAL NOT NULL,
    accuracy REAL NOT NULL,
    check_in REAL NOT NULL,
    communication REAL NOT NULL,
    location REAL NOT NULL,
    value REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );
`);

export default db;
