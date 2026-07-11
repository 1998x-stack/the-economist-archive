// src/components/ArticleCard.tsx
import Link from 'next/link'
import { Article } from '@/types'

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const excerpt = article.contentHtml
    ? article.contentHtml.replace(/<[^>]+>/g, '').slice(0, 180).trim() + '…'
    : ''

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="card-hover group block rounded-lg border border-te-border bg-white p-5 no-underline"
    >
      <div className="mb-2">
        <span className="section-badge">{article.section}</span>
      </div>

      <h3 className="mb-2 font-heading text-lg font-semibold leading-snug text-te-fg group-hover:text-te-red transition-colors">
        {article.title}
      </h3>

      <div className="mb-3 flex items-center gap-2 text-xs text-te-muted-fg font-mono">
        <time dateTime={article.date}>
          {new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{article.wordCount} words</span>
      </div>

      {excerpt && (
        <p className="text-sm leading-relaxed text-te-muted-fg line-clamp-3">
          {excerpt}
        </p>
      )}
    </Link>
  )
}
