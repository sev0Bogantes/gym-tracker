import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/exercises  → create a new exercise in a day
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { routineDayId, routineId, name, sets, reps, initialWeight, category, notes, orderIndex } = body

    if (!routineDayId || !routineId || !name) {
      return NextResponse.json({ error: 'routineDayId, routineId, name required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertPayload: any = {
      routine_day_id: routineDayId,
      routine_id: routineId,
      name,
      sets: sets ?? 3,
      reps: reps ?? '10',
      initial_weight: initialWeight ?? null,
      target_weight: initialWeight ?? null,
      category: category ?? 'General',
      notes: notes ?? null,
      order_index: orderIndex ?? 0,
      superset_id: body.supersetId ?? null,
    }
    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert(insertPayload)
      .select().single()

    if (error) throw error
    return NextResponse.json({ exercise }, { status: 201 })
  } catch (err) {
    console.error('Create exercise error:', err)
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
  }
}
