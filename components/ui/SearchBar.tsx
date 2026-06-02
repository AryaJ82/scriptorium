'use client'

import { Search, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  onKeyDown,
  icon: Icon = Search,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  icon?: LucideIcon
}) {
  return (
    <div className={cn('relative', className)}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}
