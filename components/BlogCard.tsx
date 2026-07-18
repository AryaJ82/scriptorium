import Link from 'next/link'
import { FileCode2, MessageSquare } from 'lucide-react'
import { TagBadge } from './TagBadge'
import { VoteButtons } from './ui/VoteButtons'
import { BlogResponse, CommentResponse } from '@/utils/interfaces';
import { timeAgo } from '@/utils/timeAgo';

export default function BlogPostCard({ post, updatePost }: { post: BlogResponse, updatePost: (newVal: BlogResponse) => void }) {
  return (
    <article className="flex gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50">


      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="text-balance font-serif text-xl font-medium leading-snug">
          <Link
            href={`/blog/${post.id}`}
            className="transition-colors hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag.name} label={tag.name} />
          ))}
        </div>

        {post.linkedTemplate && (
          <span className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <FileCode2 className="size-3.5" />
            Linking to template
            <Link
              href={`/templates/${post.linkedTemplate.id}`}
              className="transition-colors hover:text-primary"
            >
              <span>
                &quot;{post.linkedTemplate.title}&quot;
              </span>
            </Link>
          </span>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="font-mono">@{post.author.username}</span>
          <span>{timeAgo(post.createdAt as unknown as string)}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" /> {post.comments?.length ?? 0} Replies
          </span>

        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center shrink-0 sm:block">
        <VoteButtons
          post={post}
          postType="blog"
          updatePost={updatePost as ((p: BlogResponse | CommentResponse) => void)}
          handleActionError={() => { }}
        />
      </div>
    </article>
  )
}
