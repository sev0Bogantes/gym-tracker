import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/routines/[routineId]/days  → add a day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { dayNumber, name, description } = body

    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: day, error } = await supabase
      .from('routine_days')
      .insert({ routine_id: routineId, day_number: dayNumber ?? 1, name, description: description ?? null } as any)
      .select().single()

    if (error) throw error
    return NextResponse.json({ day }, { status: 201 })
  } catch (err) {
    console.error('Add day error:', err)
    return NextResponse.json({ error: 'Failed to add day' }, { status: 500 })
  }
}

// GET /api/routines/[routineId]/days  → list days with exercises
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('routine_days')
      .select('*, exercises(*)')
      .eq('routine_id', routineId)
      .order('day_number', { ascending: true })

    if (error) throw error
    return NextResponse.json({ days: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch days' }, { status: 500 })
  }
}
