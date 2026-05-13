import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from '@/lib/database.types'
import type { ParsedRoutine } from '@/lib/excel-parser'

type Client = SupabaseClient<Database>

// ─── Types ──────────────────────────────────────────────────────────────────

export type Routine = Tables<'routines'>
export type RoutineDay = Tables<'routine_days'>
export type Exercise = Tables<'exercises'>

export type RoutineWithDays = Routine & {
  routine_days: (RoutineDay & { exercises: Exercise[] })[]
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getActiveRoutine(
  client: Client,
  userId: string
): Promise<RoutineWithDays | null> {
  const { data, error } = await client
    .from('routines')
    .select(
      `*, routine_days(*, exercises(* ))`
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  // Sort days and exercises — cast through unknown to avoid Supabase nested type inference issues
  const raw = data as unknown as RoutineWithDays
  const sorted: RoutineWithDays = {
    ...raw,
    routine_days: [...(raw.routine_days ?? [])].sort(
      (a, b) => a.day_number - b.day_number
    ).map((d) => ({
      ...d,
      exercises: [...(d.exercises ?? [])].sort(
        (a, b) => a.order_index - b.order_index
      ),
    })),
  }
  return sorted
}

export async function getAllRoutines(
  client: Client,
  userId: string
): Promise<Routine[]> {
  const { data, error } = await client
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getRoutineById(
  client: Client,
  routineId: string
): Promise<RoutineWithDays | null> {
  const { data, error } = await client
    .from('routines')
    .select(`*, routine_days(*, exercises(*))`)
    .eq('id', routineId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const raw = data as unknown as RoutineWithDays
  const sorted: RoutineWithDays = {
    ...raw,
    routine_days: [...(raw.routine_days ?? [])].sort(
      (a, b) => a.day_number - b.day_number
    ).map((d) => ({
      ...d,
      exercises: [...(d.exercises ?? [])].sort(
        (a, b) => a.order_index - b.order_index
      ),
    })),
  }
  return sorted
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createRoutineFromParsed(
  client: Client,
  userId: string,
  parsed: ParsedRoutine,
  startDate: string,
  customName?: string
): Promise<Routine> {
  // 1. Deactivate existing active routines
  await client
    .from('routines')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  // 2. Create routine
  const routineInsert: TablesInsert<'routines'> = {
    user_id: userId,
    name: customName ?? parsed.name,
    total_weeks: parsed.totalWeeks,
    start_date: startDate,
    is_active: true,
  }

  const { data: routine, error: routineError } = await client
    .from('routines')
    .insert(routineInsert)
    .select()
    .single()

  if (routineError) throw routineError

  // 3. Create days and exercises
  for (const day of parsed.days) {
    const { data: routineDay, error: dayError } = await client
      .from('routine_days')
      .insert({
        routine_id: routine.id,
        day_number: day.dayNumber,
        name: day.name,
      })
      .select()
      .single()

    if (dayError) throw dayError

    if (day.exercises.length > 0) {
      const exercisesInsert = day.exercises.map((ex) => ({
        routine_id: routine.id,
        routine_day_id: routineDay.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        initial_weight: ex.initialWeight,
        target_weight: ex.initialWeight,
        notes: ex.notes,
        order_index: ex.orderIndex,
      }))

      const { error: exError } = await client
        .from('exercises')
        .insert(exercisesInsert)

      if (exError) throw exError
    }
  }

  return routine
}

export async function updateTargetWeight(
  client: Client,
  exerciseId: string,
  targetWeight: number
): Promise<void> {
  const { error } = await client
    .from('exercises')
    .update({ target_weight: targetWeight })
    .eq('id', exerciseId)

  if (error) throw error
}
