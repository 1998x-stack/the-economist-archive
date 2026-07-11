// src/lib/data.ts
import { Issue, IssueIndexData, Article, IssueMeta } from '@/types'
import indexData from '../../data/issues.json'

const issueIndex: IssueIndexData = indexData as IssueIndexData

export function getIssueIndex(): IssueIndexData {
  return issueIndex
}

export function getAllIssues(): IssueMeta[] {
  return issueIndex.issues
}

export function getAllSections(): string[] {
  return issueIndex.allSections
}

export function getIssue(id: string): Issue {
  const data = require(`../../data/issues/${id}.json`) as Issue
  return data
}

export function getAllArticles(): Article[] {
  const articles: Article[] = []
  for (const meta of issueIndex.issues) {
    const issue = getIssue(meta.id)
    for (const section of issue.sections) {
      for (const article of section.articles) {
        articles.push(article)
      }
    }
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date))
}

export function getArticlesBySection(sectionName: string): Article[] {
  const slug = sectionName.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '')
  const articles: Article[] = []
  for (const meta of issueIndex.issues) {
    const issue = getIssue(meta.id)
    for (const section of issue.sections) {
      if (section.slug === slug || section.name.toLowerCase() === sectionName.toLowerCase()) {
        for (const article of section.articles) {
          articles.push(article)
        }
      }
    }
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date))
}

export function getArticleBySlug(slug: string): Article | null {
  for (const meta of issueIndex.issues) {
    const issue = getIssue(meta.id)
    for (const section of issue.sections) {
      for (const article of section.articles) {
        if (article.slug === slug) {
          return article
        }
      }
    }
  }
  return null
}

export function getLatestArticles(count: number = 20): Article[] {
  return getAllArticles().slice(0, count)
}

export function getRelatedArticles(article: Article, count: number = 3): Article[] {
  const all = getAllArticles()
  return all
    .filter(a => a.slug !== article.slug && a.section === article.section)
    .slice(0, count)
}
