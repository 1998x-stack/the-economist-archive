// src/components/RelatedArticles.tsx
import { Article } from '@/types'
import ArticleCard from './ArticleCard'

interface RelatedArticlesProps {
  articles: Article[]
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <div className="mt-16 border-t border-te-border pt-8">
      <h2 className="mb-6 font-heading text-xl font-bold text-te-fg">
        More from this section
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  )
}
