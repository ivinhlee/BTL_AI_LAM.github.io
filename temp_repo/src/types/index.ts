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
  created_at?: string;
}

export interface Booking {
  id: number;
  room_id: number;
  customer_name: string;
  customer_email: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
   num_adults?: number;
   num_children?: number;
   num_infants?: number;
  total_price: number;
  status: string;
  created_at?: string;
}

export interface BookingFormData {
  customer_name: string;
  customer_email: string;
  check_in_date: string;
  check_out_date: string;
  num_adults: number;
  num_children: number;
  num_infants: number;
}
