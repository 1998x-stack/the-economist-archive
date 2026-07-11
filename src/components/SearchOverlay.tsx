// src/components/SearchOverlay.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { searchArticles } from '@/lib/search'
import { SearchItem } from '@/types'

interface SearchOverlayProps {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleChange = (value: string) => {
    setQuery(value)
    if (value.trim().length >= 2) {
      setResults(searchArticles(value))
    } else {
      setResults([])
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Search articles"
    >
      <div
        className="mx-auto mt-[10vh] max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-te-border px-5 py-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5 shrink-0 text-te-muted-fg"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-transparent font-heading text-lg text-te-fg outline-none placeholder:text-te-muted-fg"
          />
          <button
            onClick={onClose}
            className="text-sm text-te-muted-fg hover:text-te-fg font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {query.length < 2 && (
            <p className="py-8 text-center text-sm text-te-muted-fg">
              Type at least 2 characters to search
            </p>
          )}

          {query.length >= 2 && results.length === 0 && (
            <p className="py-8 text-center text-sm text-te-muted-fg">
              No articles found for &quot;{query}&quot;
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-te-border">
              {results.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/articles/${item.slug}`}
                    onClick={onClose}
                    className="block px-2 py-3 transition-colors hover:bg-te-muted rounded no-underline"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="section-badge text-xs">{item.section}</span>
                      <span className="text-xs text-te-muted-fg font-mono">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-te-fg">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-te-muted-fg line-clamp-2">
                      {item.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
