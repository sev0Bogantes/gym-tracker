import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, totalWeeks } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data: routine, error } = await supabase
      .from('routines')
      .update({ name, total_weeks: totalWeeks ?? null })
      .eq('id', routineId)
      .eq('user_id', user.id)
      .select().single()

    if (error) throw error
    return NextResponse.json({ routine })
  } catch (err) {
    console.error('Update routine error:', err)
    return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 })
  }
}
