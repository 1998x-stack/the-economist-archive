// src/types/index.ts

export interface Article {
  id: string
  slug: string
  title: string
  section: string
  issueId: string
  date: string
  contentHtml: string
  images: string[]
  wordCount: number
}

export interface Section {
  name: string
  slug: string
  articles: Article[]
}

export interface Issue {
  id: string
  title: string
  date: string
  coverImage: string
  sections: Section[]
}

export interface IssueMeta {
  id: string
  title: string
  date: string
  coverImage: string
  articleCount: number
}

export interface IssueIndexData {
  issues: IssueMeta[]
  allSections: string[]
}

export interface SearchItem {
  slug: string
  title: string
  section: string
  date: string
  excerpt: string
}
