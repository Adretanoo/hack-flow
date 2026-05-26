import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hackathonsApi } from '@/api/hackathons'
import { Search, X, Trophy } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useI18n } from '@/i18n'

interface HackathonPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (hackathonId: string) => void
  title?: string
}

export function HackathonPickerModal({ open, onClose, onSelect, title }: HackathonPickerModalProps) {
  const [search, setSearch] = useState('')
  const { t, lang } = useI18n()

  const { data, isLoading } = useQuery({
    queryKey: ['hackathons', 'published'],
    queryFn: () => hackathonsApi.list({ limit: 100 }),
  })

  if (!open) return null

  const displayTitle = title ?? t.judge.selectHackathon
  const hackathons = data?.data.data?.filter(h => h.status === 'PUBLISHED') ?? []
  const filtered = hackathons.filter(h => h.title.toLowerCase().includes(search.toLowerCase()))

  const dateLocale = lang === 'uk' ? 'uk-UA' : 'en-US'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold">{displayTitle}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder={`${t.actions.search}...`} 
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <LoadingSpinner className="py-10" />
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {search ? t.shared.emptyState.defaultTitle : t.adminHackathons.noHackathons}
            </div>
          ) : (
            filtered.map(h => (
              <button 
                key={h.id} 
                onClick={() => {
                  onSelect(h.id)
                  onClose()
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent text-left transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">{h.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.startDate).toLocaleDateString(dateLocale)} - {new Date(h.endDate).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
