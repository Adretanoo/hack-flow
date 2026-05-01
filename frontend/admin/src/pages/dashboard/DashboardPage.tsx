import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { usersApi } from '@/api/users'
import { teamsApi } from '@/api/teams'
import { usePageTitle } from '@/hooks/usePageTitle'
import { HackathonPickerModal } from '@/components/shared/HackathonPickerModal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRelative } from '@/utils/format'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Plus, Users, Trophy, ClipboardCheck, Activity, ArrowUpRight, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import type { Hackathon, UserProfile, Team } from '@/types/api.types'

export function DashboardPage() {
  usePageTitle('Дашборд')
  const navigate = useNavigate()
  const [pickerOpen, setPickerOpen] = useState(false)

  // ── Data Fetching ────────────────────────────────────────────────────────
  const { data: hackData, isLoading: hackLoading } = useQuery({
    queryKey: ['hackathons', 'all'],
    queryFn: () => hackathonsApi.list({ limit: 100 }),
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => usersApi.list({ limit: 500 }),
  })

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsApi.list({ limit: 100 }),
  })

  const isLoading = hackLoading || usersLoading || teamsLoading

  // ── Derived Data for Stats & Charts ──────────────────────────────────────
  const hackathons = (hackData?.data.data ?? []) as Hackathon[]
  const users = (usersData?.data.data ?? []) as UserProfile[]
  const teams = (teamsData?.data.data ?? []) as Team[]

  const activeHackathons = hackathons.filter(h => h.status === 'PUBLISHED').length
  const pendingTeams = teams.filter(t => t.approvalStatus === 'PENDING').length

  const pieData = [
    { name: 'Чернетки', value: hackathons.filter(h => h.status === 'DRAFT').length, color: '#94a3b8' },
    { name: 'Опубліковані', value: activeHackathons, color: '#3b82f6' },
    { name: 'Архівні', value: hackathons.filter(h => h.status === 'ARCHIVED').length, color: '#a855f7' },
  ].filter(d => d.value > 0)

  // Registrations over time (last 7 days)
  const areaData = useMemo(() => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = users.filter(u => u.createdAt?.startsWith(dateStr)).length
      data.push({ date: d.toLocaleDateString('uk-UA', { weekday: 'short' }), count })
    }
    return data
  }, [users])

  // Simulated Activity Feed (Combining recent users, teams, hackathons)
  const activityFeed = useMemo(() => {
    const feed: any[] = []
    
    users.forEach(u => feed.push({
      id: `u-${u.id}`,
      type: 'user',
      title: u.fullName,
      action: 'зареєструвався',
      date: new Date(u.createdAt || Date.now()),
      initials: u.fullName[0]?.toUpperCase(),
    }))

    teams.forEach(t => feed.push({
      id: `t-${t.id}`,
      type: 'team',
      title: t.name,
      action: 'створив команду',
      date: new Date(t.createdAt),
      initials: t.name[0]?.toUpperCase(),
    }))

    hackathons.forEach(h => feed.push({
      id: `h-${h.id}`,
      type: 'hackathon',
      title: h.title,
      action: 'створено хакатон',
      date: new Date(h.createdAt || Date.now()),
      initials: h.title[0]?.toUpperCase(),
    }))

    return feed.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15)
  }, [users, teams, hackathons])

  if (isLoading) return <LoadingSpinner className="py-20" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Огляд платформи</h2>
        <p className="text-sm text-muted-foreground">Аналітика та останні дії в системі</p>
      </div>

      {/* Row 1: Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Всього хакатонів" value={hackathons.length} icon={Trophy} />
        <StatCard title="Активні" value={activeHackathons} icon={Activity} trend="+1" />
        <StatCard title="Користувачі" value={users.length} icon={Users} trend="+12" />
        <StatCard title="Очікують схвалення" value={pendingTeams} icon={ClipboardCheck} 
          className={pendingTeams > 0 ? "border-amber-200 bg-amber-50" : ""} />
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Статус хакатонів</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Реєстрації (останні 7 днів)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Activity Feed */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col max-h-[400px]">
          <h3 className="font-semibold mb-4">Стрічка активності</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-10 text-center">Активності немає</p>
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", 
                    item.type === 'user' ? 'bg-blue-500' : item.type === 'team' ? 'bg-green-500' : 'bg-purple-500')}>
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{item.title}</span> <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(item.date.toISOString())}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold mb-2">Швидкі дії</h3>
          
          <button onClick={() => navigate('/hackathons/new')}
            className="w-full flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Створити хакатон</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button onClick={() => navigate('/teams?status=PENDING')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
            <span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-amber-500" /> Очікуючі команди</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
            <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-purple-500" /> Лідборд</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="pt-4 border-t border-border mt-2 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Останні хакатони</h4>
            {hackathons.slice(0, 3).map(h => (
              <div key={h.id} className="flex justify-between items-center cursor-pointer hover:underline" onClick={() => navigate(`/hackathons/${h.id}`)}>
                <span className="text-sm truncate font-medium max-w-[140px]">{h.title}</span>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <HackathonPickerModal 
        open={pickerOpen} 
        onClose={() => setPickerOpen(false)} 
        onSelect={(id) => navigate(`/judging/${id}`)} 
        title="Оберіть хакатон для лідборду"
      />
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, className }: { title: string; value: number | string; icon: any; trend?: string; className?: string }) {
  return (
    <div className={clsx("rounded-xl border border-border bg-card p-5 relative overflow-hidden", className)}>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-bold">{value}</h3>
            {trend && <span className="text-xs font-medium text-green-500 flex items-center mb-1"><ArrowUpRight className="h-3 w-3" /> {trend}</span>}
          </div>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
