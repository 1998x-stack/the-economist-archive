// src/components/SectionNav.tsx
'use client'

import Link from 'next/link'

interface SectionNavProps {
  sections: string[]
}

export default function SectionNav({ sections }: SectionNavProps) {
  return (
    <div className="border-t border-te-border py-2">
      <div
        className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Link
          href="/"
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-te-muted-fg transition-colors hover:bg-te-muted hover:text-te-fg font-heading"
        >
          All
        </Link>
        {sections.map((section) => (
          <Link
            key={section}
            href={`/sections/${section.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '')}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-te-muted-fg transition-colors hover:bg-te-muted hover:text-te-fg font-heading"
          >
            {section}
          </Link>
        ))}
      </div>
    </div>
  )
}
