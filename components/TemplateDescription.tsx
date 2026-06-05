'use client'

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Pencil, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { TemplateResponse } from "@/utils/interfaces";

interface DescriptionSectionProps {
  template: TemplateResponse;
  isOwner: boolean;
  onSave: (next: string) => Promise<void>;
}

export default function DescriptionSection({ template, isOwner, onSave }: DescriptionSectionProps) {
  const description = template.description;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const handleCancelEdit = useCallback(() => {
    setDraft(description);
    setEditing(false);
  }, [description]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, onSave]);

  const isEmpty = !description.trim();

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Section header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          README
        </span>
        {isOwner && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3" /> Edit
          </button>
        )}
        {isOwner && editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-3" /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a description in Markdown…"
            className="min-h-48 w-full resize-y bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        ) : isEmpty ? (
          <div
            onClick={isOwner ? () => setEditing(true) : undefined}
            className={[
              "flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-center",
              isOwner ? "cursor-pointer transition-colors hover:border-muted-foreground hover:bg-muted/40" : "",
            ].join(" ")}
          >
            <p className="text-sm text-muted-foreground">No description yet.</p>
            {isOwner && (
              <p className="text-xs text-muted-foreground/60">Click to add one.</p>
            )}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}