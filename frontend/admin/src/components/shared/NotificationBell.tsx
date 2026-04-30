import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { judgingApi } from '@/api/judging'
import { Bell, AlertTriangle } from 'lucide-react'
import type { Conflict } from '@/types/api.types'

export function NotificationBell() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts', 'recent'],
    queryFn: () => judgingApi.listAllConflicts({ limit: 5 }),
    refetchInterval: 60000, // Poll every 60s
  })

  const conflicts = ((conflictsData?.data as any)?.data ?? []) as Conflict[]
  const totalConflicts = conflictsData?.data?.total ?? 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {totalConflicts > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
            {totalConflicts > 9 ? '9+' : totalConflicts}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-border bg-card shadow-lg ring-1 ring-black ring-opacity-5 animate-fade-in z-50">
          <div className="border-b border-border p-3 flex justify-between items-center bg-muted/20 rounded-t-xl">
            <h3 className="font-semibold text-sm">Конфлікти інтересів</h3>
            {totalConflicts > 0 && <span className="text-xs bg-muted px-2 py-0.5 rounded-md font-medium">{totalConflicts} всього</span>}
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {conflicts.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground italic">
                Немає нових конфліктів
              </p>
            ) : (
              conflicts.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => {
                    setIsOpen(false)
                    // If team has hackathonId, we could route there. For now, route to judging root.
                    navigate('/judging') 
                  }}
                  className="w-full flex gap-3 rounded-lg p-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate">
                      {c.judge?.fullName || 'Суддя'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      Конфлікт з командою <strong>{c.team?.name || 'Невід. команда'}</strong>
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {totalConflicts > 5 && (
            <div className="border-t border-border p-2">
              <button 
                onClick={() => { setIsOpen(false); navigate('/judging') }}
                className="w-full rounded-lg py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Переглянути всі
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
