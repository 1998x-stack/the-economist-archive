// src/components/ArticleGrid.tsx
import { Article } from '@/types'
import ArticleCard from './ArticleCard'

interface ArticleGridProps {
  articles: Article[]
}

export default function ArticleGrid({ articles }: ArticleGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </div>
  )
}
