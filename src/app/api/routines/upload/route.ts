import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseExcelRoutine } from '@/lib/excel-parser'
import { createRoutineFromParsed } from '@/lib/models/routine.model'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const startDate = formData.get('startDate') as string | null
    const routineName = formData.get('routineName') as string | null
    const totalWeeks = Number(formData.get('totalWeeks') ?? 8)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const parsed = parseExcelRoutine(buffer)
    parsed.totalWeeks = totalWeeks

    const routine = await createRoutineFromParsed(
      supabase,
      user.id,
      parsed,
      startDate,
      routineName ?? undefined
    )

    return NextResponse.json({ routine, daysCount: parsed.days.length }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
