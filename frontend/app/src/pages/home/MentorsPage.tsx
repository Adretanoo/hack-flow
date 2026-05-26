import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { GraduationCap, Mail, Zap, ArrowRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { UserProfile } from '@/types/api.types'
import { useI18n } from '@/i18n'

function MentorCard({ mentor }: { mentor: UserProfile & { skills?: string[]; description?: string; bio?: string; socials?: { typeSocial: string; url: string }[] } }) {
  const { t } = useI18n()
  const initials = mentor.fullName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const description = mentor.description || mentor.bio || null
  const skills: string[] = mentor.skills ?? []

  // Social links
  const socials = mentor.socials ?? []
  const github  = socials.find(s => s.typeSocial === 'github')
  const telegram = socials.find(s => s.typeSocial === 'telegram')

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200">
      {/* Card header */}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          {mentor.avatarUrl ? (
            <img src={mentor.avatarUrl} alt={mentor.fullName} className="h-14 w-14 rounded-full object-cover border-2 border-border shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{mentor.fullName}</h3>
            {mentor.username && (
              <p className="text-sm text-muted-foreground">@{mentor.username}</p>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold mt-1">
              <GraduationCap className="h-3 w-3" />
              {t.mentorsPage.mentor}
            </span>
          </div>
        </div>

        {/* Bio */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 6).map(skill => (
              <span key={skill} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {skill}
              </span>
            ))}
            {skills.length > 6 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                +{skills.length - 6}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {(github || telegram) && (
        <div className="mt-auto border-t border-border px-6 py-3 flex items-center gap-3">
          {github && (
            <a href={github.url} target="_blank" rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              GitHub
            </a>
          )}
          {telegram && (
            <a href={telegram.url} target="_blank" rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Telegram
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function MentorsPage() {
  const [search, setSearch] = useState('')
  const { t } = useI18n()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mentors-public'],
    queryFn: () => usersApi.getUsers({ role: 'mentor', limit: 100 }),
  })

  const allMentors = (data?.data?.data ?? []) as (UserProfile & { skills?: string[]; description?: string; bio?: string; socials?: { typeSocial: string; url: string }[] })[]

  const mentors = search.trim()
    ? allMentors.filter(m =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (m.skills ?? []).some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        (m.description || m.bio || '').toLowerCase().includes(search.toLowerCase())
      )
    : allMentors

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 md:px-8 max-w-6xl space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <GraduationCap className="h-4 w-4" />
            {t.mentorsPage.mentor}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t.mentorsPage.title.split('Hack-Flow')[0]}<span className="text-primary">Hack-Flow</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.mentorsPage.subtitle}
          </p>
        </div>

        {/* Search */}
        {!isLoading && !isError && allMentors.length > 0 && (
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.mentorsPage.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-muted-foreground">{t.mentorsPage.loadError}</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              {t.mentorsPage.loginToView} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : mentors.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">
              {search ? t.mentorsPage.noResults : t.mentorsPage.noMentors}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-sm text-primary hover:underline">
                {t.mentorsPage.clearSearch}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              {mentors.length} {t.mentorsPage.count(mentors.length)}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mentors.map(mentor => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </>
        )}

        {/* CTA for mentors */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">{t.mentorsPage.wantMentor}</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t.mentorsPage.wantMentorDesc}
          </p>
          <a
            href="mailto:c.tehza.adrian@student.uzhnu.edu.ua"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            {t.mentorsPage.contactAdmin}
          </a>
        </div>

      </div>
    </div>
  )
}
