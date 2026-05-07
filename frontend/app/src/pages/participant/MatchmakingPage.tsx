import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, MessageCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
// In a real app we'd fetch users from a matchmaking API, here we mock an API call or use usersApi.

// We don't have a direct matchmaking route defined in our API client yet,
// so we'll simulate fetching participants looking for teams.
import api from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse, UserProfile, UserSocial } from '@/types/api.types'

type MatchmakingUser = UserProfile & { socials?: UserSocial[] }

export function MatchmakingPage() {
  const { user: currentUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [hackathonId, setHackathonId] = useState('')

  // This assumes the backend supports filtering users by isLookingForTeam=true
  // If not, it will just show all users, but the UI structure remains correct.
  const { data, isLoading } = useQuery({
    queryKey: ['matchmaking', search, hackathonId],
    queryFn: () => api.get<PaginatedResponse<MatchmakingUser>>('/users', {
      params: { 
        limit: 50, 
        search: search || undefined,
        role: 'participant',
        // isLookingForTeam: true  <- this would be needed on backend
      }
    }).then(res => res.data),
  })

  // We filter client-side just in case backend doesn't support the filter
  const users = (data?.data || []).filter(u => u.isLookingForTeam && u.id !== currentUser?.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Пошук команди" 
        subtitle="Знайдіть однодумців для участі в хакатонах"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Пошук за навичками або ім'ям..."
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Placeholder for hackathon selector or skills multi-select */}
        <select 
          className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          value={hackathonId}
          onChange={(e) => setHackathonId(e.target.value)}
        >
          <option value="">Всі хакатони</option>
          <option value="1">Global AI Hackathon</option>
          <option value="2">FinTech Challenge</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-24"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <EmptyState
          title="Нікого не знайдено"
          description="Спробуйте змінити критерії пошуку"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all">
              <div className="p-5 flex flex-col items-center text-center flex-1">
                <Avatar name={user.fullName} url={user.avatarUrl} size="lg" className="mb-4 shadow-sm" />
                <h3 className="font-semibold text-lg">{user.fullName}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                  {user.bio || 'Користувач не додав інформацію про себе.'}
                </p>
                
                {/* Mock tags since we don't have skills array on user yet */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {['Frontend', 'React'].map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border p-4 bg-muted/20 flex gap-2 justify-center">
                <button 
                  onClick={() => alert('Для запрошення користувача скопіюйте посилання (токен) у вкладці вашої команди та надішліть йому!')}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Запросити
                </button>
                <button 
                  onClick={() => alert('Функція внутрішнього чату у розробці. Незабаром тут зʼявиться можливість обмінюватись повідомленнями!')}
                  className="p-2 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Написати">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
