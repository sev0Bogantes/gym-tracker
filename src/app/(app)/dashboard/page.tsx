import { createClient } from '@/lib/supabase/server'
import { getActiveRoutine } from '@/lib/models/routine.model'
import { calculateCurrentWeek, getProgressPercent } from '@/lib/week-utils'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const routine = await getActiveRoutine(supabase, user.id)
  const currentWeek = routine ? calculateCurrentWeek(routine.start_date) : 1
  const progressPct = routine
    ? Math.round(getProgressPercent(routine.start_date, routine.total_weeks ?? 8) * 100)
    : 0

  // Fetch last week's weight logs for comparison display
  let lastWeekLogs: Record<string, number | null> = {}
  if (routine && currentWeek > 1) {
    const { data: logs } = await supabase
      .from('weight_logs')
      .select('exercise_id, weight_used')
      .eq('routine_id', routine.id)
      .eq('week_number', currentWeek - 1)

    if (logs) {
      logs.forEach((l) => { lastWeekLogs[l.exercise_id] = l.weight_used })
    }
  }

  // Fetch current week logs too (to show what's already been logged this week)
  let thisWeekLogs: Record<string, number | null> = {}
  if (routine) {
    const { data: logs } = await supabase
      .from('weight_logs')
      .select('exercise_id, weight_used')
      .eq('routine_id', routine.id)
      .eq('week_number', currentWeek)

    if (logs) {
      logs.forEach((l) => { thisWeekLogs[l.exercise_id] = l.weight_used })
    }
  }

  return (
    <DashboardClient
      routine={routine}
      currentWeek={currentWeek}
      progressPct={progressPct}
      lastWeekLogs={lastWeekLogs}
      thisWeekLogs={thisWeekLogs}
    />
  )
}
