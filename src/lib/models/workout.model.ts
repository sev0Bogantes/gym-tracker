import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from '@/lib/database.types'

type Client = SupabaseClient<Database>

export type WeightLog = Tables<'weight_logs'>
export type WorkoutSession = Tables<'workout_sessions'>

// ─── Weight Logs ─────────────────────────────────────────────────────────────

export async function getWeightLogsForExercise(
  client: Client,
  exerciseId: string
): Promise<WeightLog[]> {
  const { data, error } = await client
    .from('weight_logs')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('logged_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLastWeightLog(
  client: Client,
  exerciseId: string
): Promise<WeightLog | null> {
  const { data, error } = await client
    .from('weight_logs')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('logged_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertWeightLog(
  client: Client,
  log: TablesInsert<'weight_logs'>
): Promise<WeightLog> {
  const { data, error } = await client
    .from('weight_logs')
    .upsert(log, { onConflict: 'exercise_id,logged_date' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWeightLogsForSession(
  client: Client,
  routineId: string,
  weekNumber: number
): Promise<WeightLog[]> {
  const { data, error } = await client
    .from('weight_logs')
    .select('*')
    .eq('routine_id', routineId)
    .eq('week_number', weekNumber)

  if (error) throw error
  return data ?? []
}

// ─── Workout Sessions ─────────────────────────────────────────────────────────

export async function createWorkoutSession(
  client: Client,
  session: TablesInsert<'workout_sessions'>
): Promise<WorkoutSession> {
  const { data, error } = await client
    .from('workout_sessions')
    .insert(session)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function completeWorkoutSession(
  client: Client,
  sessionId: string
): Promise<void> {
  const { error } = await client
    .from('workout_sessions')
    .update({ is_complete: true, completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) throw error
}

export async function getActiveSession(
  client: Client,
  routineId: string,
  routineDayId: string
): Promise<WorkoutSession | null> {
  const { data, error } = await client
    .from('workout_sessions')
    .select('*')
    .eq('routine_id', routineId)
    .eq('routine_day_id', routineDayId)
    .eq('is_complete', false)
    .maybeSingle()

  if (error) throw error
  return data
}
