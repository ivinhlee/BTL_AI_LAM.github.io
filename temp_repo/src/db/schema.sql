-- Xóa bảng cũ nếu tồn tại
DROP TABLE IF EXISTS tours;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS users;

-- Bảng Người dùng
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

-- Bảng Danh sách yêu thích
CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  UNIQUE(user_id, room_id)
);

-- Bảng Chỗ ở (Y hệt Airbnb)
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,         -- Tên căn hộ/phòng
  description TEXT NOT NULL,
  price_per_night REAL NOT NULL, -- Giá mỗi đêm
  location TEXT NOT NULL,      -- Tỉnh/Thành phố
  address TEXT NOT NULL,       -- Địa chỉ chi tiết
  category TEXT NOT NULL,      -- Ví dụ: Căn hộ, Villa, Phòng riêng, Cắm trại...
  image_url TEXT NOT NULL,
  max_guests INTEGER DEFAULT 2,
  bed_count INTEGER DEFAULT 1,
  bath_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đơn đặt phòng
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER,
  user_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  check_in_date DATE NOT NULL,  -- Ngày nhận phòng
  check_out_date DATE NOT NULL, -- Ngày trả phòng
  num_guests INTEGER NOT NULL,
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  num_infants INTEGER DEFAULT 0,
  total_price REAL NOT NULL,    -- Tổng tiền = Giá x Số đêm
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Thêm dữ liệu mẫu để web hiện lên luôn cho đẹp
INSERT INTO rooms (title, description, price_per_night, location, address, category, image_url, max_guests, bed_count, bath_count)
VALUES 
('Villa View Biển Mỹ Khê', 'Căn hộ cao cấp với tầm nhìn toàn cảnh biển Đà Nẵng, đầy đủ tiện nghi.', 1500000, 'Đà Nẵng', 'Võ Nguyên Giáp, Sơn Trà', 'Căn hộ', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 4, 2, 2),
('Nhà gỗ nhỏ trên mây Sapa', 'Không gian yên tĩnh giữa thung lũng Mường Hoa, thích hợp cho cặp đôi.', 850000, 'Lào Cai', 'Bản Tả Van, Sapa', 'Nhà gỗ', 'https://images.unsplash.com/photo-1449156001935-d2863fb72690', 2, 1, 1);
