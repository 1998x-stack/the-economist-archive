// src/components/HomeClient.tsx
'use client'

import { useState } from 'react'
import Header from './Header'
import SearchOverlay from './SearchOverlay'

interface HomeClientProps {
  sections: string[]
  children: React.ReactNode
}

export default function HomeClient({ sections, children }: HomeClientProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <Header sections={sections} onSearchOpen={() => setSearchOpen(true)} />
      {children}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}
