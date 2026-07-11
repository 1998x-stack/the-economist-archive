// src/components/IssueTimeline.tsx
import Link from 'next/link'
import { IssueMeta } from '@/types'

interface IssueTimelineProps {
  issues: IssueMeta[]
}

export default function IssueTimeline({ issues }: IssueTimelineProps) {
  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={`/issues/${issue.id}`}
            className="card-hover shrink-0 rounded-lg border border-te-border bg-white p-3 no-underline w-36"
          >
            <div className="mb-2 aspect-[3/4] overflow-hidden rounded bg-te-muted">
              <img
                src={issue.coverImage}
                alt={`Cover for ${issue.title}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-medium text-te-fg font-heading truncate">
              {issue.title}
            </p>
            <p className="text-xs text-te-muted-fg font-mono mt-0.5">
              {new Date(issue.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
