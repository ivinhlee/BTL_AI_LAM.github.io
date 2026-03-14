export interface Room {
  id: number;
  title: string;
  description: string;
  price_per_night: number;
  location: string;
  address: string;
  category: string;
  image_url: string;
  max_guests: number;
  bed_count: number;
  bath_count: number;
  amenities?: string[];
  booking_options?: string[];
  accessibility?: string[];
  host_languages?: string[];
  room_type?: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin?: number | boolean;
  phone?: string;
  avatar_url?: string;
}
