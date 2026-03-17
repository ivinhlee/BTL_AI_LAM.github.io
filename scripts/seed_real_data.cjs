const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'travel_tours.db');
const db = new Database(dbPath);

const dataPath = path.join(__dirname, '..', 'data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

// Filter out errors
const validRooms = jsonData.data.filter(item => item && !item.error && item.listing_title);

console.log(`Found ${validRooms.length} valid rooms to insert.`);

// Delete existing rooms
db.prepare('DELETE FROM reviews').run();
db.prepare('DELETE FROM bookings').run();
db.prepare('DELETE FROM wishlists').run();
const deleteStmt = db.prepare('DELETE FROM rooms');
const deleted = deleteStmt.run();
console.log(`Deleted ${deleted.changes} old rooms.`);

const insertStmt = db.prepare(`
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

const transaction = db.transaction((rooms) => {
  for (const room of rooms) {
    const title = room.name || room.listing_title || 'Unknown Title';
    const description = room.description || '';
    const price = room.price || room.pricing_details?.price_per_night || 0;
    const location = room.location || 'Unknown Location';
    const address = room.location || '';
    const category = room.category || 'Rental unit';
    const image_url = room.image || (room.images && room.images.length > 0 ? room.images[0] : '');

    // Parse details
    const max_guests = room.guests || extractNumber(room.details, 'guest');
    const bed_count = extractNumber(room.details, 'bed');
    const bath_count = extractNumber(room.details, 'bath');

    let room_type = 'Entire home';
    if (title.toLowerCase().includes('room') || category.toLowerCase().includes('room')) {
      room_type = 'Private room';
    }

    // Convert arrays to JSON strings
    const images_list = room.images ? JSON.stringify(room.images) : null;
    const reviews_list = room.reviews_details ? JSON.stringify(room.reviews_details) : (room.reviews ? JSON.stringify(room.reviews) : null);
    const amenities_list = room.amenities ? JSON.stringify(room.amenities) : null;
    const amenities = room.amenities ? JSON.stringify(room.amenities) : null; // keeping backward compatibility if needed

    insertStmt.run(
      title, description, price, location, address, category, image_url,
      max_guests, bed_count, bath_count, amenities, room_type,
      images_list, reviews_list, amenities_list
    );
  }
});

transaction(validRooms);

console.log('Seeding completed successfully!');
