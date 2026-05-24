export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "client" | "mechanic";
  created_at: string;
  updated_at: string;
}

export interface MechanicProfile {
  id: string;
  user_id: string;
  workshop_name: string;
  description: string | null;
  location: string;
  address: string | null;
  phone: string | null;
  specialties: string[];
  is_available: boolean;
  rating: number;
  total_reviews: number;
  latitude: number | null;
  longitude: number | null;
  years_experience: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  mechanic_id: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  service_type: string | null;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  mechanic_profiles?: MechanicProfile;
  profiles?: Profile;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "location" | "audio";
  image_url: string | null;
  audio_url: string | null;
  location_data: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Review {
  id: string;
  mechanic_id: string;
  client_id: string;
  request_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: Profile;
}

export const LOCATIONS = [
  "Accra",
  "Kumasi",
  "Tema",
  "Tamale",
  "Takoradi",
  "Cape Coast",
  "Koforidua",
  "Sunyani",
  "Ho",
  "Wa",
] as const;

export const SPECIALTIES = [
  "Engine Repair",
  "Tire Services",
  "Electrical Systems",
  "Towing",
  "Body Work",
  "AC Repair",
  "Brake Systems",
  "Transmission",
  "Oil Change",
  "General Maintenance",
] as const;

export type Location = (typeof LOCATIONS)[number];
export type Specialty = (typeof SPECIALTIES)[number];
