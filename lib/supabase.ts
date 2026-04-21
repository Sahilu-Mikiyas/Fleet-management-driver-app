import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Supabase client with environment variables
// You'll need to set SUPABASE_URL and SUPABASE_ANON_KEY in your environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type definitions for driver and assignment data
export interface Driver {
  id: string;
  email: string;
  name: string;
  license_number: string;
  company_id: string;
  is_approved: boolean;
  is_on_duty: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  driver_id: string;
  route_id: string;
  route_name: string;
  vehicle_id: string;
  status: "assigned" | "en_route" | "completed" | "cancelled";
  scheduled_departure: string;
  scheduled_arrival: string;
  passenger_count: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  model: string;
  capacity: number;
  company_id: string;
  created_at: string;
}

export interface Manifest {
  id: string;
  assignment_id: string;
  passenger_name: string;
  reserved_seat: string;
  created_at: string;
}

export interface Notification {
  id: string;
  driver_id: string;
  type: "new_assignment" | "approval_change" | "admin_message";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DriverNotes {
  id: string;
  assignment_id: string;
  notes: string;
  special_instructions: string;
  created_at: string;
}
