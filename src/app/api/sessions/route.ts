import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createWorkoutSession,
  completeWorkoutSession,
} from '@/lib/models/workout.model'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { routineId, routineDayId, weekNumber } = body

    if (!routineId || !routineDayId || weekNumber === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const session = await createWorkoutSession(supabase, {
      user_id: user.id,
      routine_id: routineId,
      routine_day_id: routineDayId,
      week_number: weekNumber,
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    console.error('Create session error:', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    await completeWorkoutSession(supabase, sessionId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Complete session error:', err)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}
