// src/lib/search.ts
import Fuse from 'fuse.js'
import { getAllArticles } from './data'
import { SearchItem } from '@/types'

let searchIndex: Fuse<SearchItem> | null = null

export function getSearchIndex(): Fuse<SearchItem> {
  if (searchIndex) return searchIndex

  const articles = getAllArticles()
  const items: SearchItem[] = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    section: a.section,
    date: a.date,
    excerpt: a.contentHtml.replace(/<[^>]+>/g, '').slice(0, 200),
  }))

  searchIndex = new Fuse(items, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'excerpt', weight: 0.3 },
      { name: 'section', weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  })

  return searchIndex
}

export function searchArticles(query: string): SearchItem[] {
  if (!query.trim() || query.trim().length < 2) return []
  const fuse = getSearchIndex()
  const results = fuse.search(query.trim())
  return results.slice(0, 20).map((r) => r.item)
}
