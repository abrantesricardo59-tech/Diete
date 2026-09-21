export type Role = 'coach' | 'coache';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  coach_id: string | null;
  created_at: string;
}

export interface Food {
  id: string;
  created_by: string;
  off_code: string | null;
  name: string;
  brand: string | null;
  image_url: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_custom: boolean;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_id: string;
  quantity_g: number;
  meal: Meal;
  logged_at: string;
  created_at: string;
  food?: Food;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
  note: string | null;
  created_at: string;
}

export interface TrainingProgram {
  id: string;
  coach_id: string;
  coache_id: string;
  name: string;
  description: string | null;
  created_at: string;
  exercises?: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  program_id: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
}

export interface WorkoutLog {
  id: string;
  coache_id: string;
  program_id: string | null;
  performed_at: string;
  notes: string | null;
  sets?: WorkoutSetLog[];
}

export interface WorkoutSetLog {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
}

export interface Conversation {
  id: string;
  coach_id: string;
  coache_id: string;
  created_at: string;
  other_profile?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export type SessionStatus = 'open' | 'booked' | 'cancelled';

export interface CoachingSession {
  id: string;
  coach_id: string;
  coache_id: string | null;
  starts_at: string;
  ends_at: string;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  coache?: Profile;
}

export type PricingInterval = 'once' | 'monthly' | 'quarterly' | 'yearly';

export interface PricingPlan {
  id: string;
  coach_id: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: PricingInterval;
  description: string | null;
  created_at: string;
}
