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
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const logs = await getWeightLogsForExercise(supabase, exerciseId)
    return NextResponse.json({ logs })
  } catch (err) {
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
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Full exercise update (from builder)
    if (body.name !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: any = {
        name: body.name,
        sets: body.sets,
        reps: body.reps,
        initial_weight: body.initialWeight ?? null,
        target_weight: body.targetWeight ?? body.initialWeight ?? null,
        category: body.category ?? 'General',
        notes: body.notes ?? null,
      }
      const { data, error } = await supabase
        .from('exercises')
        .update(updatePayload)
        .eq('id', exerciseId)
        .select().single()
      if (error) throw error
      return NextResponse.json({ exercise: data })
    }

    // Quick target weight update (from dashboard)
    const { targetWeight } = body
    if (targetWeight === undefined || targetWeight === null) {
      return NextResponse.json({ error: 'targetWeight required' }, { status: 400 })
    }
    await updateTargetWeight(supabase, exerciseId, Number(targetWeight))
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  try {
    const { exerciseId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase.from('weight_logs').delete().eq('exercise_id', exerciseId)
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 })
  }
}
