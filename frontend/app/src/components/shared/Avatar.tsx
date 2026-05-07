import { clsx } from 'clsx'

interface AvatarProps {
  name: string
  url?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={clsx('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
