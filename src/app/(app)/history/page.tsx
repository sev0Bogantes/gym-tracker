import { createClient } from '@/lib/supabase/server'
import { getActiveRoutine } from '@/lib/models/routine.model'
import { calculateCurrentWeek } from '@/lib/week-utils'
import { redirect } from 'next/navigation'
import HistoryClient from './HistoryClient'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const routine = await getActiveRoutine(supabase, user.id)
  if (!routine) redirect('/upload')

  const currentWeek = calculateCurrentWeek(routine.start_date)

  // Fetch all weight logs for this routine
  const { data: logs } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('routine_id', routine.id)
    .order('logged_date', { ascending: false })

  return (
    <HistoryClient
      routine={routine}
      logs={logs ?? []}
      currentWeek={currentWeek}
    />
  )
}
