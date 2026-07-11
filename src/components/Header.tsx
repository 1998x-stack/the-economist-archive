// src/components/Header.tsx
'use client'

import Link from 'next/link'
import SectionNav from './SectionNav'

interface HeaderProps {
  sections: string[]
  onSearchOpen: () => void
}

export default function Header({ sections, onSearchOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-te-border">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        {/* Top bar: logo + search */}
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="font-heading text-xl font-bold tracking-tight text-te-fg sm:text-2xl">
              The Economist
            </span>
          </Link>

          <button
            onClick={onSearchOpen}
            className="flex items-center gap-2 rounded-full border border-te-border px-4 py-2 text-sm text-te-muted-fg transition-colors hover:border-te-fg hover:text-te-fg"
            aria-label="Open search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-xs border border-te-border rounded px-1.5 py-0.5 ml-1">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Section nav */}
        <SectionNav sections={sections} />
      </div>
    </header>
  )
}
