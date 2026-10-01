'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/Dialog'
type ActionDialogProps = {
  title: string
  description: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  confirmAction: () => void | Promise<void>
  actionLoading: boolean
  actionLabel?: string
}

export default function ActionDialog({
  title,
  description,
  isOpen,
  setIsOpen,
  confirmAction,
  actionLoading,
  actionLabel = 'Confirm',
}: ActionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !actionLoading && setIsOpen(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmAction} disabled={actionLoading}>
            {actionLoading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
            {actionLoading ? 'Processing…' : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
