import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db from "./src/db/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
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
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
      const result = stmt.run(name, email, hashedPassword);

      const token = jwt.sign({ userId: result.lastInsertRowid, name, email }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email } });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
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

  // Get all rooms
  app.get("/api/rooms", (req, res) => {
    try {
      const { search } = req.query;
      let query = 'SELECT * FROM rooms ORDER BY created_at DESC';
      let params: any[] = [];

      if (search && typeof search === 'string') {
        query = 'SELECT * FROM rooms WHERE title LIKE ? OR location LIKE ? ORDER BY created_at DESC';
        const searchTerm = `%${search}%`;
        params = [searchTerm, searchTerm];
      }

      const rooms = db.prepare(query).all(...params);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
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

  // Create a booking
  app.post("/api/bookings", authenticateToken, (req: any, res: any) => {
    try {
      const { room_id, customer_name, customer_email, check_in_date, check_out_date, num_guests } = req.body;
      const user_id = req.user.userId;

      // Basic validation
      if (!room_id || !customer_name || !customer_email || !check_in_date || !check_out_date || !num_guests) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Calculate total price on the server
      const room = db.prepare('SELECT price_per_night FROM rooms WHERE id = ?').get(room_id) as { price_per_night: number } | undefined;
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const start = new Date(check_in_date);
      const end = new Date(check_out_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        return res.status(400).json({ error: "Check-out date must be after check-in date" });
      }

      const total_price = room.price_per_night * diffDays;

      const stmt = db.prepare(`
        INSERT INTO bookings (room_id, user_id, customer_name, customer_email, check_in_date, check_out_date, num_guests, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(room_id, user_id, customer_name, customer_email, check_in_date, check_out_date, num_guests, total_price);

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
