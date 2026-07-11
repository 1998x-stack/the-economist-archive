// src/components/ArticleBody.tsx
interface ArticleBodyProps {
  contentHtml: string
}

export default function ArticleBody({ contentHtml }: ArticleBodyProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  )
}
