import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeightLogsForExercise } from '@/lib/models/workout.model'
import { updateTargetWeight } from '@/lib/models/routine.model'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  try {
    const { exerciseId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await getWeightLogsForExercise(supabase, exerciseId)
    return NextResponse.json({ logs })
  } catch (err) {
    console.error('GET exercise logs error:', err)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  try {
    const { exerciseId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetWeight } = body

    if (targetWeight === undefined || targetWeight === null) {
      return NextResponse.json({ error: 'targetWeight required' }, { status: 400 })
    }

    await updateTargetWeight(supabase, exerciseId, Number(targetWeight))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH exercise error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
