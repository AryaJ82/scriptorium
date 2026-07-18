'use client'


import { Root, Image, Fallback } from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof Root>) {
  return (
    <Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof Image>) {
  return (
    <Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      alt="Avatar"
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof Fallback>) {
  return (
    <Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export function DisplayAvatar({
  user,
  size
}: {
  user: { username: string; avatarUrl?: string | null };
  size: 'sm' | 'md' | 'lg'
}) {
  return (

      <Avatar className={`size-${size === 'sm' ? '6' : size === 'md' ? '8' : '10'} border`}>
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.username} />
        ) : (
          <AvatarFallback className="text-sm font-medium">
            {user.username?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>

  );
}