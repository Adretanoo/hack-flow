import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import type { UserSocial } from '@/types/api.types'

const SOCIAL_CONFIG: Record<UserSocial['typeSocial'], { label: string; icon: string; placeholder: string; color: string }> = {
  github: {
    label: 'GitHub',
    icon: '⌥',
    placeholder: 'https://github.com/username',
    color: 'bg-gray-900 text-white',
  },
  telegram: {
    label: 'Telegram',
    icon: '✈',
    placeholder: 'https://t.me/username',
    color: 'bg-blue-500 text-white',
  },
  discord: {
    label: 'Discord',
    icon: '◈',
    placeholder: 'username#0000 або посилання',
    color: 'bg-indigo-500 text-white',
  },
  viber: {
    label: 'Viber',
    icon: '◎',
    placeholder: 'https://viber.me/username',
    color: 'bg-violet-600 text-white',
  },
}

const SOCIAL_TYPES = Object.keys(SOCIAL_CONFIG) as UserSocial['typeSocial'][]

export function SocialsSection() {
  const queryClient = useQueryClient()
  const [type, setType] = useState<UserSocial['typeSocial']>('github')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const { data: socialsResp, isLoading } = useQuery({
    queryKey: ['my-socials'],
    queryFn: () => usersApi.getSocials(),
  })

  const socials: UserSocial[] = socialsResp?.data?.data ?? []

  const addMut = useMutation({
    mutationFn: () => usersApi.addSocial({ typeSocial: type, url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-socials'] })
      setUrl('')
      setError('')
    },
    onError: () => setError('Не вдалося додати. Перевірте URL.'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.deleteSocial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-socials'] }),
  })

  const handleAdd = () => {
    if (!url.trim()) { setError('Введіть URL'); return }
    setError('')
    addMut.mutate()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-bold">Соціальні мережі</h3>
        <p className="text-sm text-muted-foreground mt-1">Додайте посилання на ваші профілі у соціальних мережах</p>
      </div>

      {/* Existing socials */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground animate-pulse">Завантаження...</div>
      ) : socials.length > 0 ? (
        <ul className="space-y-2">
          {socials.map((s) => {
            const cfg = SOCIAL_CONFIG[s.typeSocial]
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 group transition-colors hover:bg-muted/50"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${cfg.color}`}>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cfg.label}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate block"
                  >
                    {s.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMut.mutate(s.id)}
                  disabled={deleteMut.isPending}
                  className="opacity-0 group-hover:opacity-100 ml-2 shrink-0 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40"
                >
                  Видалити
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-lg bg-muted/30 border border-border py-4 text-center text-sm text-muted-foreground">
          Жодних соціальних мереж ще не додано
        </div>
      )}

      {/* Add form */}
      <div className="pt-2 border-t border-border space-y-3">
        <p className="text-sm font-medium">Додати нову</p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                type === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
            >
              <span>{SOCIAL_CONFIG[t].icon}</span>
              {SOCIAL_CONFIG[t].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            placeholder={SOCIAL_CONFIG[type].placeholder}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={addMut.isPending}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addMut.isPending ? '...' : 'Додати'}
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
