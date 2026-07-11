import { Metadata } from 'next'
import { getAllSections, getArticlesBySection } from '@/lib/data'
import ArticlePageClient from '@/components/ArticlePageClient'
import ArticleGrid from '@/components/ArticleGrid'

interface Props {
  params: { name: string }
}

export function generateStaticParams() {
  const sections = getAllSections()
  return sections.map((s) => ({
    name: s.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, ''),
  }))
}

export function generateMetadata({ params }: Props): Metadata {
  const sections = getAllSections()
  const section = sections.find(
    (s) => s.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '') === params.name
  )
  return {
    title: section || params.name,
    description: `Articles from the ${section || params.name} section of The Economist`,
  }
}

export default function SectionPage({ params }: Props) {
  const sections = getAllSections()
  const sectionName = sections.find(
    (s) => s.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '') === params.name
  ) || params.name

  const articles = getArticlesBySection(sectionName)

  return (
    <ArticlePageClient sections={sections}>
      <main className="py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-te-fg">{sectionName}</h1>
          <p className="mt-2 text-te-muted-fg">{articles.length} articles</p>
        </div>
        <ArticleGrid articles={articles} />
      </main>
    </ArticlePageClient>
  )
}
