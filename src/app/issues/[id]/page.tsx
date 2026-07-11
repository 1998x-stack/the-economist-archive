import { Metadata } from 'next'
import { getAllIssues, getIssue, getAllSections } from '@/lib/data'
import ArticlePageClient from '@/components/ArticlePageClient'
import ArticleCard from '@/components/ArticleCard'

interface Props {
  params: { id: string }
}

export function generateStaticParams() {
  const issues = getAllIssues()
  return issues.map((i) => ({ id: i.id }))
}

export function generateMetadata({ params }: Props): Metadata {
  const issue = getIssue(params.id)
  return {
    title: issue?.title || params.id,
    description: `The Economist issue from ${issue?.date}`,
  }
}

export default function IssuePage({ params }: Props) {
  const issue = getIssue(params.id)
  const sections = getAllSections()

  if (!issue) {
    return (
      <ArticlePageClient sections={sections}>
        <main className="py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Issue not found</h1>
          <a href="/" className="text-te-red underline mt-4 inline-block">Back to home</a>
        </main>
      </ArticlePageClient>
    )
  }

  return (
    <ArticlePageClient sections={sections}>
      <main className="py-8">
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <img
              src={issue.coverImage}
              alt={`Cover for ${issue.title}`}
              className="w-32 rounded shadow-md sm:w-40"
            />
            <div>
              <h1 className="font-heading text-3xl font-bold text-te-fg">
                {issue.title}
              </h1>
              <p className="mt-2 text-te-muted-fg font-mono text-sm">
                {new Date(issue.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="mt-1 text-sm text-te-muted-fg">
                {issue.sections.length} sections &middot;{' '}
                {issue.sections.reduce((sum, s) => sum + s.articles.length, 0)} articles
              </p>
            </div>
          </div>
        </div>

        {issue.sections.map((section) => (
          <section key={section.slug} className="mb-10">
            <h2 className="mb-4 font-heading text-xl font-bold text-te-fg">
              {section.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </ArticlePageClient>
  )
}
