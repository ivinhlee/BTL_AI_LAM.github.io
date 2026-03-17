const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'travel_tours.db');
const db = new Database(dbPath);

const dataPath = path.join(__dirname, '..', 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

console.log(`Processing ${jsonData.data.length} items from data.json...`);

// Delete existing rooms to start fresh
db.prepare('DELETE FROM reviews').run();
db.prepare('DELETE FROM bookings').run();
db.prepare('DELETE FROM wishlists').run();
const deleteStmt = db.prepare('DELETE FROM rooms');
const deleted = deleteStmt.run();
console.log(`Deleted ${deleted.changes} old rooms.`);

const insertRoom = db.prepare(`
  INSERT INTO rooms (
    title, description, price_per_night, location, address, category, image_url,
    max_guests, bed_count, bath_count, amenities, room_type,
    images_list, reviews_list, amenities_list
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?
  )
`);

const extractNumber = (detailsArray, keyword) => {
  if (!Array.isArray(detailsArray)) return 1;
  const item = detailsArray.find(d => d.includes(keyword));
  if (item) {
    const match = item.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 1;
};

// Wrap DB insert in transaction for performance
const runSeeding = db.transaction(() => {
  jsonData.data.forEach((item, index) => {
    if (!item) return; // Nếu item rỗng thì bỏ qua luôn

    if (!item.error && (item.listing_title || item.name)) {
      try {
        const title = item.listing_title || item.name || 'Unknown Title';
        const description = item.description || '';
        const price = item.price || item.pricing_details?.price_per_night || 0;
        const location = item.location || 'Unknown Location';
        const address = item.location || '';
        const category = item.category || 'Rental unit';
        const image_url = item.image || (item.images && item.images.length > 0 ? item.images[0] : '');

        // Parse details
        const max_guests = item.guests || extractNumber(item.details, 'guest');
        const bed_count = extractNumber(item.details, 'bed');
        const bath_count = extractNumber(item.details, 'bath');

        let room_type = 'Entire home';
        if (title.toLowerCase().includes('room') || category.toLowerCase().includes('room')) {
          room_type = 'Private room';
        }

        // Convert arrays to JSON strings
        const images_list = JSON.stringify(item.images || []);
        const reviews_list = JSON.stringify(item.reviews_details || item.reviews || []);
        const amenities_list = JSON.stringify(item.amenities || []);
        const amenities = JSON.stringify(item.amenities || []); // keeping backward compatibility

        insertRoom.run(
          title, description, price, location, address, category, image_url,
          max_guests, bed_count, bath_count, amenities, room_type,
          images_list, reviews_list, amenities_list
        );
        console.log(`[${index}] ✅ Đã nạp: ${title}`);
      } catch (err) {
        console.error(`[${index}] ❌ Lỗi DB tại phòng ${item.listing_title}:`, err.message);
      }
    }
  });
});

runSeeding();

console.log('Seeding completed successfully!');
