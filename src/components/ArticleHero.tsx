// src/components/ArticleHero.tsx
import { Article } from '@/types'

interface ArticleHeroProps {
  article: Article
}

export default function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <div className="mb-8">
      <span className="section-badge mb-3">{article.section}</span>

      <h1 className="font-heading text-3xl font-bold leading-tight text-te-fg sm:text-4xl md:text-5xl">
        {article.title}
      </h1>

      <div className="mt-4 flex items-center gap-2 text-sm text-te-muted-fg font-mono">
        <time dateTime={article.date}>
          {new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{article.wordCount} words</span>
        <span>·</span>
        <span>{article.issueId.replace('TE-', '')}</span>
      </div>

      {article.images.length > 0 && (
        <img
          src={article.images[0]}
          alt=""
          className="mt-6 w-full rounded-lg object-cover max-h-[500px]"
        />
      )}
    </div>
  )
}
