'use client'

import { SubmitEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useUserSession } from '@/contexts/UserSessionContext'

type ReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint: string
  subjectLabel: string
}

export function ReportDialog({ open, onOpenChange, endpoint, subjectLabel }: ReportDialogProps) {
  const { authFetch } = useUserSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setTitle('')
    setContent('')
    setError(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Please provide a title and explanation.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error ?? 'Unable to submit report.')
      reset()
      onOpenChange(false)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {subjectLabel}</DialogTitle>
          <DialogDescription>Tell us what is wrong with this content. Reports are reviewed by moderators.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="report-title" className="text-sm font-medium">Reason</label>
            <Input id="report-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Spam, harassment, or other issue" disabled={submitting} required />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="report-content" className="text-sm font-medium">Details</label>
            <Textarea id="report-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Describe the issue" rows={5} disabled={submitting} required />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim() || !content.trim()}>{submitting ? 'Submitting…' : 'Submit report'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
