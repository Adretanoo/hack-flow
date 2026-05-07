import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users, Trophy } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatDate } from '@/utils/format'
import type { Hackathon } from '@/types/api.types'

interface HackathonCardProps {
  hackathon: Hackathon
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  // Determine gradient based on status if no banner
  const gradientClass = 
    hackathon.status === 'PUBLISHED' ? 'from-green-500 to-emerald-400' :
    hackathon.status === 'DRAFT' ? 'from-blue-500 to-cyan-400' :
    'from-slate-500 to-gray-400'

  // Get active stage if exists
  const activeStage = hackathon.stages?.find(s => s.status === 'ACTIVE')

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`h-32 w-full bg-gradient-to-r ${gradientClass} relative`}>
        {hackathon.status === 'PUBLISHED' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Active
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <StatusBadge status={hackathon.status} />
          {activeStage && (
            <span className="text-xs font-medium text-primary">
              Етап: {activeStage.type}
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
        
        <div className="mt-auto flex flex-col gap-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{hackathon.online ? 'Online' : hackathon.location || 'TBA'}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
            <div className="flex items-center gap-1.5" title="Кількість напрямків">
              <Trophy className="h-4 w-4" />
              <span className="font-medium text-foreground">{hackathon.tracks?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Зареєстровано команд">
              <Users className="h-4 w-4" />
              <span className="font-medium text-foreground">{hackathon.teams?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
