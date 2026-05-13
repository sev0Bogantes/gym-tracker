import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertWeightLog, getWeightLogsForSession } from '@/lib/models/workout.model'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseId, routineId, weightUsed, setsDone, repsDone, weekNumber, notes } = body

    if (!exerciseId || !routineId || weekNumber === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const log = await upsertWeightLog(supabase, {
      user_id: user.id,
      exercise_id: exerciseId,
      routine_id: routineId,
      weight_used: weightUsed ?? null,
      sets_done: setsDone ?? null,
      reps_done: repsDone ?? null,
      week_number: weekNumber,
      notes: notes ?? null,
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (err) {
    console.error('Log weight error:', err)
    return NextResponse.json({ error: 'Failed to log weight' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const routineId = searchParams.get('routineId')
    const weekNumber = Number(searchParams.get('weekNumber') ?? 1)

    if (!routineId) {
      return NextResponse.json({ error: 'routineId required' }, { status: 400 })
    }

    const logs = await getWeightLogsForSession(supabase, routineId, weekNumber)
    return NextResponse.json({ logs })
  } catch (err) {
    console.error('GET logs error:', err)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
