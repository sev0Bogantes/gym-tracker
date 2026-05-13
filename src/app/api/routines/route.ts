import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllRoutines } from '@/lib/models/routine.model'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    if (searchParams.get('active') === 'true') {
      const { data } = await supabase
        .from('routines').select('*').eq('user_id', user.id).eq('is_active', true)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      return NextResponse.json({ routine: data })
    }

    const routines = await getAllRoutines(supabase, user.id)
    return NextResponse.json({ routines })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, startDate, totalWeeks } = body

    if (!name || !startDate) {
      return NextResponse.json({ error: 'name and startDate are required' }, { status: 400 })
    }

    // Deactivate existing active routines
    await supabase.from('routines').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true)

    const { data: routine, error } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name, start_date: startDate, total_weeks: totalWeeks ?? 8, is_active: true })
      .select().single()

    if (error) throw error
    return NextResponse.json({ routine }, { status: 201 })
  } catch (err) {
    console.error('Create routine error:', err)
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 })
  }
}
