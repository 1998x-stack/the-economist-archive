// src/components/ArticlePageClient.tsx
'use client'

import Header from './Header'
import Footer from './Footer'

interface ArticlePageClientProps {
  sections: string[]
  children: React.ReactNode
}

export default function ArticlePageClient({ sections, children }: ArticlePageClientProps) {
  return (
    <>
      <Header sections={sections} onSearchOpen={() => {}} />
      {children}
      <Footer />
    </>
  )
}
