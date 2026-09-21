import { supabase } from '@/lib/supabase';
import type { ProgramExercise, TrainingProgram, WorkoutLog, WorkoutSetLog } from '@/types/database';

export async function getProgramsForCoache(coacheId: string): Promise<TrainingProgram[]> {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, exercises:program_exercises(*)')
    .eq('coache_id', coacheId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TrainingProgram[];
}

export async function getProgramsCreatedByCoach(coachId: string): Promise<TrainingProgram[]> {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*, exercises:program_exercises(*)')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TrainingProgram[];
}

export async function createProgram(params: {
  coachId: string;
  coacheId: string;
  name: string;
  description?: string;
  exercises: Omit<ProgramExercise, 'id' | 'program_id'>[];
}): Promise<TrainingProgram> {
  const { data: program, error } = await supabase
    .from('training_programs')
    .insert({
      coach_id: params.coachId,
      coache_id: params.coacheId,
      name: params.name,
      description: params.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  if (params.exercises.length > 0) {
    const { error: exercisesError } = await supabase.from('program_exercises').insert(
      params.exercises.map((exercise) => ({ ...exercise, program_id: program.id }))
    );
    if (exercisesError) throw exercisesError;
  }

  return program as TrainingProgram;
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('training_programs').delete().eq('id', id);
  if (error) throw error;
}

export async function logWorkout(params: {
  coacheId: string;
  programId?: string;
  notes?: string;
  sets: Omit<WorkoutSetLog, 'id' | 'workout_log_id'>[];
}): Promise<WorkoutLog> {
  const { data: workoutLog, error } = await supabase
    .from('workout_logs')
    .insert({
      coache_id: params.coacheId,
      program_id: params.programId ?? null,
      notes: params.notes ?? null,
      performed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  if (params.sets.length > 0) {
    const { error: setsError } = await supabase.from('workout_set_logs').insert(
      params.sets.map((set) => ({ ...set, workout_log_id: workoutLog.id }))
    );
    if (setsError) throw setsError;
  }

  return workoutLog as WorkoutLog;
}

export async function getWorkoutHistory(coacheId: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*, sets:workout_set_logs(*)')
    .eq('coache_id', coacheId)
    .order('performed_at', { ascending: false });
  if (error) throw error;
  return data as WorkoutLog[];
}
