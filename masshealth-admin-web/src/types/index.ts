export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin?: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  metadata?: UserMetadata;
}

export interface UserMetadata {
  username: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitness_experience?: string;
  profile_image_url?: string;
}

export interface MQTTLocationMessage {
  id: string;
  senderId: string;
  senderName: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface Exercise {
  id: number;
  name: string;
  video_url: string;
  muscle_group: { id: number; name: string };
  exercise_type: string;
  equipment_required: string;
  experience_level: string;
}

export interface Routine {
  id: number;
  name: string;
  description?: string;
  user: User;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  totalExercises: number;
  totalRoutines: number;
}