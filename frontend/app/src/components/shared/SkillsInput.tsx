import { useState, useRef, KeyboardEvent } from 'react'
import { useI18n } from '@/i18n'

interface SkillsInputProps {
  value: string[]
  onChange: (skills: string[]) => void
  disabled?: boolean
}

export function SkillsInput({ value, onChange, disabled }: SkillsInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  const addSkill = (raw: string) => {
    const skill = raw.trim().toLowerCase()
    if (!skill || value.includes(skill) || value.length >= 20) return
    onChange([...value, skill])
    setInput('')
  }

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      removeSkill(value[value.length - 1])
    }
  }

  return (
    <div
      className="min-h-[44px] flex flex-wrap gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-medium text-primary"
        >
          {skill}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeSkill(skill) }}
              className="ml-0.5 rounded-full hover:bg-primary/20 transition-colors w-4 h-4 flex items-center justify-center text-primary/60 hover:text-primary"
              aria-label={`${t.actions.remove} ${skill}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkill(input)}
          placeholder={value.length === 0 ? t.profile.skillsPlaceholder : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={disabled}
        />
      )}
    </div>
  )
}
