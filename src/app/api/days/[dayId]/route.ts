import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/days/[dayId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  try {
    const { dayId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete exercises first (cascade should handle, but be explicit)
    await supabase.from('exercises').delete().eq('routine_day_id', dayId)
    const { error } = await supabase.from('routine_days').delete().eq('id', dayId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete day error:', err)
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 })
  }
}

// PATCH /api/days/[dayId] — rename/redescribe a day
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  try {
    const { dayId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description } = body

    const { data, error } = await supabase
      .from('routine_days')
      .update({ ...(name && { name }), ...(description !== undefined && { description }) })
      .eq('id', dayId)
      .select().single()

    if (error) throw error
    return NextResponse.json({ day: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 })
  }
}
