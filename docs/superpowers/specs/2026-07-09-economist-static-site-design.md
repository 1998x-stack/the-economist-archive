# The Economist Static Site — Design Spec

**Date:** 2026-07-09
**Status:** Approved

## Overview

Build a static website that parses The Economist epub archive and presents articles in an editorial, article-first experience. Deployed via GitHub Pages with automated weekly rebuilds.

---

## Architecture

```
GitHub Repo
├── TE-YYYY-MM-DD/              # Existing epub issues (27 weeks)
├── scripts/
│   └── parse_epubs.py           # Python epub → JSON extractor
├── data/                        # Generated JSON (committed to repo)
│   ├── issues.json              # Issue index (all issues metadata)
│   └── issues/
│       └── TE-2026-07-04.json   # Per-issue: sections + articles + content
├── public/
│   └── images/
│       ├── covers/              # Extracted cover JPEGs
│       └── articles/            # Extracted article images
├── src/                         # Next.js app (static export)
│   ├── app/
│   │   ├── page.tsx             # Home: latest articles, hero, section nav
│   │   ├── layout.tsx           # Root layout with fonts + metadata
│   │   ├── articles/[slug]/     # Full article view
│   │   ├── sections/[name]/     # Articles by section
│   │   └── issues/[id]/         # Single issue TOC + articles
│   ├── components/              # Editorial UI components
│   ├── lib/                     # Data loading, search index, utils
│   └── types/                   # TypeScript interfaces
├── .github/workflows/
│   └── deploy.yml               # Parse → Build → Deploy to GitHub Pages
└── next.config.js               # output: 'export', basePath, images config
```

### Data Flow
```
Epub files → Python parser (scripts/parse_epubs.py)
  → JSON files (data/issues/*.json, data/issues.json)
    → Next.js build-time data loading (src/lib/data.ts)
      → Static HTML pages
        → GitHub Pages deployment
```

---

## Epub Parsing Design

### Script: `scripts/parse_epubs.py`

Written in Python using only stdlib (`zipfile`, `xml.etree.ElementTree`, `json`, `os`, `re`, `shutil`).

**Processing steps per epub:**

1. Open epub as ZIP
2. Parse `META-INF/container.xml` → locate `content.opf`
3. Parse `content.opf`:
   - Extract metadata: `dc:title`, `dc:date`, `dc:description`
   - The description field contains the article list (plaintext)
4. Parse `nav.xhtml`:
   - Extract section hierarchy (e.g., "The world this week" → "Politics", "Business")
   - Extract article titles and their target HTML files
   - Build the TOC structure
5. Parse each `index_split_*.html`:
   - Extract raw HTML content
   - Strip calibre-specific CSS classes (`.calibre`, `.calibre_1`, etc.)
   - Keep semantic elements: `<p>`, `<b>/<strong>`, `<i>/<em>`, `<a>`, `<img>`, `<ul>/<ol>/<li>`
   - Extract `<img src="...">` references
6. Extract images:
   - Copy `cover.jpeg` → `public/images/covers/TE-YYYY-MM-DD.jpg`
   - Copy article images from `images/` → `public/images/articles/`
   - Generate unique filenames to avoid collisions across issues
7. Output `data/issues/TE-YYYY-MM-DD.json`

### JSON Output Structure

```json
{
  "id": "TE-2026-07-04",
  "title": "July 4th 2026",
  "date": "2026-07-04",
  "coverImage": "/images/covers/TE-2026-07-04.jpg",
  "sections": [
    {
      "name": "The world this week",
      "slug": "the-world-this-week",
      "articles": [
        {
          "id": "politics-2026-07-04",
          "slug": "politics-2026-07-04",
          "title": "Politics",
          "section": "the-world-this-week",
          "issueId": "TE-2026-07-04",
          "date": "2026-07-04",
          "contentHtml": "<p>...</p>",
          "images": ["/images/articles/TE-2026-07-04-00022.jpg"],
          "wordCount": 450
        }
      ]
    }
  ]
}
```

### Incremental Mode

- First run: parse all 27 epub files
- Subsequent runs (CI): skip issues already in `data/issues/`, parse only new ones
- A `data/checksums.json` tracks epub file hashes for change detection

---

## Site Structure

### Pages

| Route | Source | Purpose |
|-------|--------|---------|
| `/` | `src/app/page.tsx` | Home — hero, section nav, latest articles grid |
| `/articles/[slug]` | `src/app/articles/[slug]/page.tsx` | Full article with editorial layout |
| `/sections/[name]` | `src/app/sections/[name]/page.tsx` | Articles filtered by section |
| `/issues/[id]` | `src/app/issues/[id]/page.tsx` | Single issue with TOC and all articles |

### Static Params

All routes use `generateStaticParams()` to produce static pages:
- `/articles/[slug]` — one page per article (~500-800 pages across 27 issues)
- `/sections/[name]` — one per section (~15 sections)
- `/issues/[id]` — one per issue (27 pages)

---

## Component Tree

```
Layout (src/app/layout.tsx)
├── Header
│   ├── Logo
│   ├── SearchToggle
│   └── SectionNav (horizontal scrollable pills)
├── [Page Content]
└── Footer

Home Page
├── ArticleHero (lead story, large)
├── SectionNav (repeated, prominent)
├── ArticleGrid (2-3 columns, latest articles)
│   └── ArticleCard[]
└── IssueTimeline (compact horizontal scroll of past covers)

Article Page
├── ArticleHero (headline, date, section badge, lead image)
├── ArticleBody
│   ├── DropCap (first paragraph)
│   ├── ContentHtml (rendered article HTML)
│   └── PullQuote (extracted from content)
├── ArticleImages (inline images with captions)
└── RelatedArticles

SearchOverlay
├── SearchInput (Fuse.js, fuzzy matching)
├── SearchResults (title, section, date, excerpt)
└── Keyboard navigation (esc to close, arrows to navigate)
```

---

## Design System

### Style: Editorial Grid / Magazine

**Typography:**
- **Headings:** Public Sans (sans-serif, clean, modern contrast to body) — weights 600, 700
- **Body:** Source Serif 4 (serif, print-editorial feel) — weights 400, 600
- **Code/Labels:** JetBrains Mono (monospace, for dates/section tags)

**Colors:**
| Role | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` | Page background |
| Foreground | `#0A0A0A` | Body text |
| Muted | `#F5F5F5` | Card backgrounds |
| Muted foreground | `#525252` | Secondary text, dates |
| Accent | `#E3120B` | The Economist red — links, section badges, hover states |
| Border | `#E5E5E5` | Dividers, card borders |

Dark mode: not in scope for initial release.

**Layout:**
- Max content width: 1200px
- CSS Grid for article grids (2-col tablet, 3-col desktop)
- 8px spacing scale
- Asymmetric hero layouts on home page

**Key effects:**
- Drop caps on article first paragraph (`::first-letter`, 3 lines tall)
- Pull quotes (large serif text, left border accent)
- Subtle hover lifts on cards (transform 2px, shadow)
- Smooth scroll, reveal on scroll for article cards

---

## Search Implementation

- **Library:** Fuse.js (client-side fuzzy search)
- **Index:** Built at Next.js build time, serialized to JSON, loaded on demand
- **Scope:** Article titles, section names, and first 200 chars of content
- **UI:** Overlay triggered by header search icon or Ctrl+K
- **Results:** Title, section badge, date, content excerpt with highlighted match

---

## GitHub Actions CI/CD

### Workflow: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 1 * * 1'  # Every Monday at 1:00 AM UTC
  workflow_dispatch:       # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Parse epubs
        run: python3 scripts/parse_epubs.py
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install & Build
        run: |
          npm ci
          npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## Out of Scope (v1)

- Dark mode
- Commenting / user accounts
- PDF/MOBI/AZW3 rendering (only epub content is parsed)
- Full-text search within article bodies (only titles + excerpts indexed)
- RSS feed
- Audio playback
- PWA / offline support

---

## Success Criteria

1. `npm run build` generates static HTML for all 27 issues
2. All articles are readable with editorial styling (drop caps, serif body, proper images)
3. Section-based browsing works for all sections
4. Search returns relevant results for article titles
5. GitHub Actions workflow parses new issues and deploys automatically
6. Site loads in under 3 seconds on 3G
7. All pages are valid static HTML (no JS required for content rendering)
