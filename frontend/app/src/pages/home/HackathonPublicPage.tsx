import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Calendar, MapPin, Users, Globe, ExternalLink, ChevronLeft } from 'lucide-react'
import { hackathonsApi } from '@/api/hackathons'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/utils/format'
import { useHackathonStage } from '@/hooks/useHackathonStage'

export function HackathonPublicPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['public-hackathon', id],
    queryFn: () => hackathonsApi.getById(id!),
    enabled: !!id,
  })

  // Визначає активний етап за датами — викликається завжди (до будь-яких early returns).
  // useHackathonStage коректно обробляє undefined і повертає canRegister: false.
  const hackathon = data?.data?.data
  const { activeStage, canRegister: stageAllowsRegistration } = useHackathonStage(hackathon)

  // Реєстрація відкрита:
  // • якщо є стейджі → тільки stage-логіка (REGISTRATION stage з активними датами)
  // • якщо стейджів немає → fallback: хакатон PUBLISHED і дата в межах startDate..endDate
  const hasStages = hackathon != null && (hackathon.stages?.length ?? 0) > 0
  const now = new Date()
  const withinDates =
    hackathon != null &&
    new Date(hackathon.startDate) <= now &&
    now <= new Date(hackathon.endDate)
  const isRegistrationOpen = hasStages
    ? stageAllowsRegistration
    : hackathon?.status === 'PUBLISHED' && withinDates

  if (isLoading) return <div className="py-24"><LoadingSpinner size="lg" /></div>
  if (!hackathon) return <div className="py-24 text-center">Хакатон не знайдено</div>

  return (
    <div className="animate-fade-in space-y-8">
      <Link to={user ? '/app/hackathons' : '/'} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Всі хакатони
      </Link>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (70%) */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={hackathon.status} />
              {activeStage && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Етап: {activeStage.type}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{hackathon.title}</h1>
            {hackathon.subtitle && <p className="text-xl text-muted-foreground">{hackathon.subtitle}</p>}
          </div>

          <div className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown>{hackathon.description}</ReactMarkdown>
          </div>

          {/* Tracks */}
          {hackathon.tracks && hackathon.tracks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Напрямки (Tracks)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {hackathon.tracks.map(track => (
                  <div key={track.id} className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-semibold text-lg">{track.name}</h4>
                    {track.description && <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (30%) */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Дати проведення</p>
                  <p className="text-muted-foreground">
                    {formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                {hackathon.online ? <Globe className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
                <div>
                  <p className="font-medium">Формат</p>
                  <p className="text-muted-foreground">
                    {hackathon.online ? 'Online' : hackathon.location || 'TBA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Команди</p>
                  <p className="text-muted-foreground">
                    Від {hackathon.minTeamSize} до {hackathon.maxTeamSize} учасників
                  </p>
                </div>
              </div>
            </div>

            {hackathon.rulesUrl && (
              <a 
                href={hackathon.rulesUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-md border border-border py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                Правила участі <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <div className="pt-4 border-t border-border">
              {!isRegistrationOpen ? (
                <button disabled className="flex w-full justify-center rounded-md bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed">
                  Реєстрація закрита
                </button>
              ) : !user ? (
                <Link to="/register" className="flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                  Увійти для реєстрації
                </Link>
              ) : (
                <Link to={`/app/hackathons/${hackathon.id}`} className="flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                  Подати заявку на участь
                </Link>
              )}
            </div>
          </div>

          {/* Tags */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Теги</h4>
              <div className="flex flex-wrap gap-2">
                {hackathon.tags.map((tag: any) => (
                  <span key={tag.id || tag.tag?.id} className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-foreground">
                    {tag.name || tag.tag?.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
