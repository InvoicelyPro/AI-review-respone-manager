import { createClient } from '@/lib/supabase/server'
import DashboardOverview from '@/components/dashboard/dashboard-overview'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Overview of your review management activity
        </p>
      </div>
      <DashboardOverview companyId={userData?.company_id} />
    </div>
  )
}
