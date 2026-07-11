// src/components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-te-border py-8">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link href="/" className="font-heading text-lg font-bold text-te-fg no-underline">
            The Economist
          </Link>
          <p className="text-sm text-te-muted-fg">
            Educational archive — all rights belong to The Economist Group Limited.
          </p>
        </div>
      </div>
    </footer>
  )
}
