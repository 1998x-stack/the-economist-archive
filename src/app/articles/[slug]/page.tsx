// src/app/articles/[slug]/page.tsx
import { Metadata } from 'next'
import { getAllArticles, getArticleBySlug, getRelatedArticles, getAllSections } from '@/lib/data'
import ArticlePageClient from '@/components/ArticlePageClient'
import ArticleHero from '@/components/ArticleHero'
import ArticleBody from '@/components/ArticleBody'
import RelatedArticles from '@/components/RelatedArticles'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  const articles = getAllArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticleBySlug(params.slug)
  if (!article) return { title: 'Article not found' }
  return {
    title: article.title,
    description: article.contentHtml.replace(/<[^>]+>/g, '').slice(0, 160),
  }
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug)
  const sections = getAllSections()

  if (!article) {
    return (
      <ArticlePageClient sections={sections}>
        <main className="py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Article not found</h1>
          <a href="/" className="text-te-red underline mt-4 inline-block">Back to home</a>
        </main>
      </ArticlePageClient>
    )
  }

  const related = getRelatedArticles(article, 3)

  return (
    <ArticlePageClient sections={sections}>
      <main className="py-8">
        <article>
          <ArticleHero article={article} />
          <ArticleBody contentHtml={article.contentHtml} />
        </article>
        <RelatedArticles articles={related} />
      </main>
    </ArticlePageClient>
  )
}
