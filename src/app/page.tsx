// src/app/page.tsx
import { getLatestArticles, getAllIssues, getAllSections } from '@/lib/data'
import ArticleGrid from '@/components/ArticleGrid'
import IssueTimeline from '@/components/IssueTimeline'
import Footer from '@/components/Footer'
import HomeClient from '@/components/HomeClient'

export default function Home() {
  const articles = getLatestArticles(30)
  const issues = getAllIssues()
  const sections = getAllSections()

  const heroArticle = articles[0]
  const gridArticles = articles.slice(1, 19)
  const recentIssues = issues.slice(0, 12)

  return (
    <>
      <HomeClient sections={sections}>
        <main className="pb-16">
          {/* Hero article */}
          {heroArticle && (
            <section className="py-8">
              <a
                href={`/articles/${heroArticle.slug}`}
                className="card-hover group block overflow-hidden rounded-lg border border-te-border bg-white no-underline"
              >
                <div className="grid md:grid-cols-2">
                  {heroArticle.images.length > 0 && (
                    <div className="aspect-[16/10] overflow-hidden bg-te-muted md:aspect-auto">
                      <img
                        src={heroArticle.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-6 md:p-10">
                    <span className="section-badge mb-3">{heroArticle.section}</span>
                    <h1 className="font-heading text-2xl font-bold leading-tight text-te-fg group-hover:text-te-red transition-colors sm:text-3xl md:text-4xl">
                      {heroArticle.title}
                    </h1>
                    <p className="mt-4 text-te-muted-fg font-mono text-xs">
                      {new Date(heroArticle.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </a>
            </section>
          )}

          {/* Latest articles grid */}
          <section className="py-8">
            <h2 className="mb-6 font-heading text-2xl font-bold text-te-fg">
              Latest Articles
            </h2>
            <ArticleGrid articles={gridArticles} />
          </section>

          {/* Issue timeline */}
          <section className="py-8">
            <h2 className="mb-6 font-heading text-2xl font-bold text-te-fg">
              Past Issues
            </h2>
            <IssueTimeline issues={recentIssues} />
          </section>
        </main>

        <Footer />
      </HomeClient>
    </>
  )
}
