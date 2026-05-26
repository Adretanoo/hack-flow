import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users, Trophy } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatDate, getStatusLabel } from '@/utils/format'
import type { Hackathon } from '@/types/api.types'
import { useI18n } from '@/i18n'

interface HackathonCardProps {
  hackathon: Hackathon
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const { t, lang } = useI18n()
  // Determine gradient based on status if no banner
  const gradientClass = 
    hackathon.status === 'PUBLISHED' ? 'from-green-500 to-emerald-400' :
    hackathon.status === 'DRAFT' ? 'from-blue-500 to-cyan-400' :
    'from-slate-500 to-gray-400'

  // Get active stage: either pre-calculated from backend or find in stages list
  const now = new Date()
  const activeStage = hackathon.activeStage || hackathon.stages?.find(s => now >= new Date(s.startDate) && now <= new Date(s.endDate))

  const logicalStatus = 
    hackathon.status === 'PUBLISHED' 
      ? (now > new Date(hackathon.endDate) || activeStage?.type === 'FINISHED' ? 'past' : (now < new Date(hackathon.startDate) ? 'upcoming' : 'active'))
      : hackathon.status;

  const statusLabel = getStatusLabel(logicalStatus, lang);

  const dotColor = 
    logicalStatus === 'active' ? 'bg-green-500' :
    logicalStatus === 'upcoming' ? 'bg-blue-500' :
    'bg-gray-400';

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`h-32 w-full bg-gradient-to-r ${gradientClass} relative shrink-0`}>
        {hackathon.status === 'PUBLISHED' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white">
            <span className="relative flex h-2 w-2">
              {logicalStatus === 'active' && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-75`}></span>
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`}></span>
            </span>
            {statusLabel}
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <StatusBadge status={logicalStatus} />
          {activeStage && (
            <span className="text-xs font-medium text-primary">
              {t.dashboard.stageLabel}: {activeStage.type === 'CUSTOM' ? activeStage.name : activeStage.type}
            </span>
          )}
        </div>
        
        <h3 className="mb-1 text-xl font-bold leading-tight group-hover:text-primary transition-colors">
          <Link to={`/hackathons/${hackathon.id}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {hackathon.title}
          </Link>
        </h3>
        
        {hackathon.subtitle && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {hackathon.subtitle}
          </p>
        )}
        
        <div className="mt-auto space-y-3">
          <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formatDate(hackathon.startDate, lang)} - {formatDate(hackathon.endDate, lang)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{hackathon.online ? t.publicHackathon.onlineFormat : hackathon.location || 'TBA'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5" title={t.adminHackathons.awards}>
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-foreground">{hackathon._count?.awards || 0}</span>
              </div>
              <div className="flex items-center gap-1.5" title={t.shared.hackathonCard.participants}>
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-foreground">{hackathon._count?.participants || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" title={t.shared.hackathonCard.teams}>
              <span className="text-xs text-muted-foreground">{t.shared.hackathonCard.teams}:</span>
              <span className="font-medium text-foreground">{hackathon._count?.teams || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
