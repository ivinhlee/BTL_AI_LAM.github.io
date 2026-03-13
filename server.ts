import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db from "./src/db/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Ensure DB has the latest columns (idempotent migrations)
function runMigrations() {
  try {
    db.prepare('ALTER TABLE users ADD COLUMN birth_date TEXT').run();
  } catch (err) {
    // Ignore if column already exists
  }
  try {
    db.prepare('ALTER TABLE users ADD COLUMN phone TEXT').run();
  } catch (err) {
    // Ignore if column already exists
  }
  try {
    db.prepare('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0').run();
  } catch (err) {
    // Ignore if column already exists
  }
  try {
    db.prepare('ALTER TABLE bookings ADD COLUMN num_adults INTEGER DEFAULT 1').run();
  } catch (err) {
    // Ignore if column already exists
  }
  try {
    db.prepare('ALTER TABLE bookings ADD COLUMN num_children INTEGER DEFAULT 0').run();
  } catch (err) {
    // Ignore if column already exists
  }
  try {
    db.prepare('ALTER TABLE bookings ADD COLUMN num_infants INTEGER DEFAULT 0').run();
  } catch (err) {
    // Ignore if column already exists
  }
}

async function ensureAdminUser() {
  const existing = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
  if (existing) return;

  const email = 'admin@seabnb.local';
  const password = 'Admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const fullName = 'Seabnb Admin';

  const stmt = db.prepare('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)');
  stmt.run(fullName, email, hashedPassword);
  console.log('Seeded default admin user:', email, 'password:', password, '(đổi mật khẩu sau khi đăng nhập)');
}

async function startServer() {
  runMigrations();
  await ensureAdminUser();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Routes
  app.post("/api/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, phoneNumber, birthDate } = req.body;
      const safeFirstName = (firstName || '').trim();
      const safeLastName = (lastName || '').trim();
      const safeEmail = (email || '').trim();
      const safePassword = password || '';

      if (!safeFirstName || !safeEmail || !safePassword) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ Tên, Email và Mật khẩu" });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(safeEmail);
      if (existingUser) {
        return res.status(400).json({ error: "Email này đã được sử dụng" });
      }

      const hashedPassword = await bcrypt.hash(safePassword, 10);
      const fullName = `${safeLastName} ${safeFirstName}`.trim();

      const stmt = db.prepare('INSERT INTO users (name, email, password, phone, birth_date) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(fullName, safeEmail, hashedPassword, phoneNumber || null, birthDate || null);

      const token = jwt.sign({ userId: result.lastInsertRowid, name: fullName, email: safeEmail, is_admin: 0 }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: result.lastInsertRowid, name: fullName, email: safeEmail, is_admin: 0 } });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi đăng ký" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const safeEmail = (email || '').trim();
      const safePassword = password || '';

      if (!safeEmail || !safePassword) {
        return res.status(400).json({ error: "Vui lòng nhập Email và Mật khẩu" });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(safeEmail) as any;
      if (!user) {
        return res.status(401).json({ error: "Tài khoản không tồn tại" });
      }

      const isValid = await bcrypt.compare(safePassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Mật khẩu không chính xác" });
      }

      const token = jwt.sign({ userId: user.id, name: user.name, email: user.email, is_admin: user.is_admin || 0 }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin || 0 } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi đăng nhập" });
    }
  });

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ error: "Admin only" });
    }
    next();
  };

  // Get all rooms
  app.get("/api/rooms", (req, res) => {
    try {
      const { search, location, guests } = req.query;
      let query = 'SELECT * FROM rooms WHERE 1=1';
      let params: any[] = [];

      if (search && typeof search === 'string') {
        query += ' AND (title LIKE ? OR location LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (location && typeof location === 'string') {
        query += ' AND (title LIKE ? OR location LIKE ? OR address LIKE ?)';
        const locTerm = `%${location}%`;
        params.push(locTerm, locTerm, locTerm);
      }

      if (guests && typeof guests === 'string') {
        query += ' AND max_guests >= ?';
        params.push(Number(guests));
      }

      query += ' ORDER BY created_at DESC';

      const rooms = db.prepare(query).all(...params);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Admin: view bookings of a room
  app.get("/api/admin/rooms/:id/bookings", authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const bookings = db.prepare(`
        SELECT b.*, r.title, r.location 
        FROM bookings b
        JOIN rooms r ON r.id = b.room_id
        WHERE b.room_id = ?
        ORDER BY b.check_in_date ASC
      `).all(id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching room bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Admin: clear bookings of a room
  app.delete("/api/admin/rooms/:id/bookings", authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM bookings WHERE room_id = ?');
      const result = stmt.run(id);
      res.json({ message: "Đã xóa toàn bộ booking của phòng", deleted: result.changes });
    } catch (error) {
      console.error("Error clearing room bookings:", error);
      res.status(500).json({ error: "Failed to clear bookings" });
    }
  });

  // Admin: clear all bookings
  app.delete("/api/admin/bookings", authenticateToken, requireAdmin, (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM bookings');
      const result = stmt.run();
      res.json({ message: "Đã xóa toàn bộ booking", deleted: result.changes });
    } catch (error) {
      console.error("Error clearing bookings:", error);
      res.status(500).json({ error: "Failed to clear all bookings" });
    }
  });

  // Admin: list all bookings with room info
  app.get("/api/admin/all-bookings", authenticateToken, requireAdmin, (req, res) => {
    try {
      const query = `
        SELECT 
          b.id AS booking_id,
          b.customer_name,
          b.customer_email,
          b.check_in_date,
          b.check_out_date,
          b.total_price,
          b.status,
          b.num_guests,
          b.num_adults,
          b.num_children,
          b.num_infants,
          r.title AS room_name,
          r.id AS room_id,
          r.location AS room_location
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        ORDER BY b.created_at DESC
      `;
      const rows = db.prepare(query).all();
      res.json(rows);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get single room by ID
  app.get("/api/rooms/:id", (req, res) => {
    try {
      const { id } = req.params;
      const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ error: "Failed to fetch room details" });
    }
  });

  // Create a room (Admin)
  app.post("/api/rooms", authenticateToken, (req: any, res: any) => {
    try {
      const { title, location, address, category, price_per_night, max_guests, bed_count, bath_count, description, image_url } = req.body;

      if (!title || !location || !price_per_night) {
        return res.status(400).json({ error: "Title, location, and price are required" });
      }

      const stmt = db.prepare(`
        INSERT INTO rooms (title, location, address, category, price_per_night, max_guests, bed_count, bath_count, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        title, location, address || '', category || 'Căn hộ', 
        price_per_night, max_guests || 1, bed_count || 1, bath_count || 1, 
        description || '', image_url || ''
      );

      res.status(201).json({ message: "Room created successfully", roomId: result.lastInsertRowid });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Check availability for a room
  app.get("/api/rooms/:id/check-availability", (req, res) => {
    try {
      const { id } = req.params;
      const { check_in_date, check_out_date, total_guests } = req.query;

      if (!check_in_date || !check_out_date) {
        return res.status(400).json({ error: "Thiếu ngày nhận/trả phòng" });
      }

      const room = db.prepare('SELECT id, max_guests FROM rooms WHERE id = ?').get(id) as any;
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const start = new Date(String(check_in_date));
      const end = new Date(String(check_out_date));
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Ngày nhận/trả phòng không hợp lệ" });
      }
      if (end <= start) {
        return res.status(400).json({ error: "Check-out date must be after check-in date" });
      }

      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const guests = Number(total_guests) || 1;
      if (guests > room.max_guests) {
        return res.status(400).json({ error: `Tối đa ${room.max_guests} khách (không tính thú cưng)` });
      }

      const overlapQuery = `
        SELECT COUNT(*) as count FROM bookings 
        WHERE room_id = ? AND check_in_date < ? AND check_out_date > ?
      `;
      const overlap = db.prepare(overlapQuery).get(id, check_out_date, check_in_date) as { count: number };

      const available = overlap.count === 0;
      return res.json({ available });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ error: "Failed to check availability" });
    }
  });

  // Create a booking
  app.post("/api/bookings", authenticateToken, (req: any, res: any) => {
    try {
      const { room_id, customer_name, customer_email, check_in_date, check_out_date, num_adults, num_children, num_infants } = req.body;
      const user_id = req.user.userId;

      // Basic validation
      if (!room_id || !customer_name || !customer_email || !check_in_date || !check_out_date || num_adults === undefined) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin đặt phòng" });
      }

      // Calculate total price on the server
      const room = db.prepare('SELECT price_per_night, max_guests FROM rooms WHERE id = ?').get(room_id) as { price_per_night: number, max_guests: number } | undefined;
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const start = new Date(check_in_date);
      const end = new Date(check_out_date);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Ngày nhận/trả phòng không hợp lệ" });
      }
      if (end <= start) {
        return res.status(400).json({ error: "Check-out date must be after check-in date" });
      }

      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const safeAdults = Math.max(1, Number(num_adults) || 1);
      const safeChildren = Math.max(0, Number(num_children) || 0);
      const safeInfants = Math.max(0, Number(num_infants) || 0);
      const totalPeople = safeAdults + safeChildren + safeInfants;

      if (totalPeople > (room as any).max_guests) {
        return res.status(400).json({ error: `Tối đa ${(room as any).max_guests} khách (không tính thú cưng)` });
      }

      // Check overlapping bookings
      const overlapQuery = `
        SELECT COUNT(*) as count FROM bookings 
        WHERE room_id = ? AND check_in_date < ? AND check_out_date > ?
      `;
      const overlap = db.prepare(overlapQuery).get(room_id, check_out_date, check_in_date) as { count: number };
      if (overlap.count > 0) {
        return res.status(409).json({ error: "Rất tiếc, phòng đã được đặt trong thời gian này" });
      }

      const total_price = room.price_per_night * diffDays;

      const stmt = db.prepare(`
        INSERT INTO bookings (room_id, user_id, customer_name, customer_email, check_in_date, check_out_date, num_guests, num_adults, num_children, num_infants, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(room_id, user_id, customer_name, customer_email, check_in_date, check_out_date, totalPeople, safeAdults, safeChildren, safeInfants, total_price);

      res.status(201).json({ 
        message: "Booking successful", 
        bookingId: result.lastInsertRowid 
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Get user's bookings
  app.get("/api/my-bookings", authenticateToken, (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const bookings = db.prepare(`
        SELECT b.*, r.title, r.image_url, r.location 
        FROM bookings b 
        JOIN rooms r ON b.room_id = r.id 
        WHERE b.user_id = ? 
        ORDER BY b.created_at DESC
      `).all(user_id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching my bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get user's wishlist
  app.get("/api/wishlist", authenticateToken, (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const wishlist = db.prepare(`
        SELECT r.* 
        FROM wishlists w 
        JOIN rooms r ON w.room_id = r.id 
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
      `).all(user_id);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  // Add to wishlist
  app.post("/api/wishlist", authenticateToken, (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const { room_id } = req.body;
      if (!room_id) return res.status(400).json({ error: "room_id is required" });

      const stmt = db.prepare('INSERT OR IGNORE INTO wishlists (user_id, room_id) VALUES (?, ?)');
      stmt.run(user_id, room_id);
      res.status(201).json({ message: "Added to wishlist" });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  // Remove from wishlist
  app.delete("/api/wishlist/:roomId", authenticateToken, (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const { roomId } = req.params;
      const stmt = db.prepare('DELETE FROM wishlists WHERE user_id = ? AND room_id = ?');
      stmt.run(user_id, roomId);
      res.json({ message: "Removed from wishlist" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // Get user profile
  app.get("/api/profile", authenticateToken, (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const user = db.prepare('SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?').get(user_id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update user profile
  app.put("/api/profile", authenticateToken, (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const { name, email, phone, avatar_url } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const stmt = db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ? WHERE id = ?');
      stmt.run(name, email, phone || null, avatar_url || null, user_id);
      
      const updatedUser = db.prepare('SELECT id, name, email, phone, avatar_url FROM users WHERE id = ?').get(user_id);
      res.json({ message: "Profile updated", user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update password
  app.put("/api/profile/password", authenticateToken, async (req: any, res: any) => {
    try {
      const user_id = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
      }

      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(user_id) as any;
      if (!user) return res.status(404).json({ error: "User not found" });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid current password" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
      stmt.run(hashedNewPassword, user_id);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
