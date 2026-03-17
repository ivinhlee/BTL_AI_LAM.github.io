import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(process.cwd(), 'travel_tours.db');
const db = new Database(dbPath);

// Ensure the new columns exist in the DB (in case server.ts hasn't run yet)
try {
  db.prepare('ALTER TABLE rooms ADD COLUMN images_list TEXT').run();
} catch (err) {}
try {
  db.prepare('ALTER TABLE rooms ADD COLUMN reviews_list TEXT').run();
} catch (err) {}
try {
  db.prepare('ALTER TABLE rooms ADD COLUMN amenities_list TEXT').run();
} catch (err) {}

function seed() {
  const dataPath = path.join(process.cwd(), 'data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('File data.json not found!');
    return;
  }

  const fileContent = fs.readFileSync(dataPath, 'utf8');
  let dataObj;
  try {
    dataObj = JSON.parse(fileContent);
  } catch (err) {
    console.error('Error parsing data.json:', err);
    return;
  }

  const items = dataObj.data || [];

  const insertStmt = db.prepare(`
    INSERT INTO rooms (
      title, description, price_per_night, location, address, category, image_url,
      max_guests, bed_count, bath_count, images_list, reviews_list, amenities_list
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  let count = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object' || item.error) {
      continue;
    }

    const title = item.name || item.listing_title || 'Unknown Room';
    const imageUrl = item.image || '';
    const description = item.description || '';
    const price = item.price || 0;
    const location = item.location || 'Vietnam';
    const address = item.location || 'Vietnam';
    const category = 'Căn hộ';

    // Parse bed and bath count from title if possible
    let bedCount = 1;
    let bathCount = 1;
    let maxGuests = 2;

    const bedMatch = title.match(/(\d+)\s*beds?/i);
    if (bedMatch) bedCount = parseInt(bedMatch[1], 10);

    const bathMatch = title.match(/(\d+(?:\.\d+)?)\s*baths?/i);
    if (bathMatch) bathCount = Math.ceil(parseFloat(bathMatch[1]));

    const bedroomMatch = title.match(/(\d+)\s*bedrooms?/i);
    if (bedroomMatch) {
        maxGuests = parseInt(bedroomMatch[1], 10) * 2;
    }

    const imagesList = JSON.stringify(item.images || []);
    const reviewsList = JSON.stringify(item.reviews || []);
    const amenitiesList = JSON.stringify(item.amenities || []);

    try {
      insertStmt.run(
        title, description, price, location, address, category, imageUrl,
        maxGuests, bedCount, bathCount, imagesList, reviewsList, amenitiesList
      );
      console.log(`✅ Đã nạp thành công ${title}`);
      count++;
    } catch (err) {
      console.error(`Lỗi khi nạp ${title}:`, err);
    }
  }

  console.log(`Finished seeding ${count} rooms.`);
}

seed();
