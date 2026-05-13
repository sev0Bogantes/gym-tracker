import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveRoutine, getAllRoutines } from '@/lib/models/routine.model'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    if (activeOnly) {
      const routine = await getActiveRoutine(supabase, user.id)
      return NextResponse.json({ routine })
    }

    const routines = await getAllRoutines(supabase, user.id)
    return NextResponse.json({ routines })
  } catch (err) {
    console.error('GET routines error:', err)
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 })
  }
}
