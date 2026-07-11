# The Economist Static Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static website that parses The Economist epub archive and presents articles in an editorial, article-first experience, deployed via GitHub Pages.

**Architecture:** Python stdlib parses epub ZIPs into JSON data files. Next.js reads JSON at build time via `generateStaticParams()` and exports pure static HTML. Fuse.js provides client-side search. GitHub Actions runs parser + build + deploy on push and weekly cron.

**Tech Stack:** Next.js 14+ (static export), Tailwind CSS v3, TypeScript, Python 3 (stdlib only: zipfile, xml.etree, json), Fuse.js

## Global Constraints

- Python 3.10+ for epub parser (stdlib only, no pip dependencies)
- Node.js 20+ for Next.js
- Next.js `output: 'export'` — all pages must be static, no SSR/API routes
- All pages valid HTML — content rendered without JS required
- Google Fonts: Source Serif 4 (body), Public Sans (headings), JetBrains Mono (labels)
- The Economist red accent: `#E3120B`
- Max content width: 1200px
- Initial release: 27 issues (TE-2026-01-03 through TE-2026-07-04)

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `.gitignore` (modify existing)

**Interfaces:**
- Produces: `npm run build` compiles empty Next.js app with static export. Tailwind processes CSS. `npm run dev` starts dev server.

- [ ] **Step 1: Create package.json**

```bash
cd /workspace/data/xieming/other-codes/The_Economist
```

```json
{
  "name": "the-economist-archive",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "fuse.js": "^7.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

- [ ] **Step 4: Create postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'te-red': '#E3120B',
        'te-fg': '#0A0A0A',
        'te-muted': '#F5F5F5',
        'te-muted-fg': '#525252',
        'te-border': '#E5E5E5',
      },
      fontFamily: {
        heading: ['Public Sans', 'sans-serif'],
        body: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      maxWidth: {
        'content': '1200px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Update .gitignore**

Add to existing `.gitignore`:
```
node_modules/
.next/
out/
```

- [ ] **Step 7: Create src/app/layout.tsx (minimal)**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Economist Archive',
  description: 'Weekly issues of The Economist',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create src/app/globals.css (minimal)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create src/app/page.tsx (placeholder)**

```tsx
export default function Home() {
  return <main className="p-8"><h1 className="font-heading text-4xl font-bold">The Economist Archive</h1></main>
}
```

- [ ] **Step 10: Install and verify build**

```bash
npm install
npx tsc --noEmit
npm run build
```

Expected: Build succeeds, `out/` directory created with static HTML.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.js postcss.config.js tailwind.config.ts .gitignore src/
git commit -m "scaffold: Next.js static export with Tailwind CSS"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Produces: `Article`, `Section`, `Issue`, `IssueIndex` types used by all data loading and components.

- [ ] **Step 1: Write types**

```ts
// src/types/index.ts

export interface Article {
  id: string
  slug: string
  title: string
  section: string
  issueId: string
  date: string
  contentHtml: string
  images: string[]
  wordCount: number
}

export interface Section {
  name: string
  slug: string
  articles: Article[]
}

export interface Issue {
  id: string
  title: string
  date: string
  coverImage: string
  sections: Section[]
}

export interface IssueMeta {
  id: string
  title: string
  date: string
  coverImage: string
  articleCount: number
}

export interface IssueIndexData {
  issues: IssueMeta[]
  allSections: string[]
}

export interface SearchItem {
  slug: string
  title: string
  section: string
  date: string
  excerpt: string
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for Issue, Article, Section"
```

---

### Task 3: Epub Parser Script

**Files:**
- Create: `scripts/parse_epubs.py`

**Interfaces:**
- Consumes: epub files at `TE-YYYY-MM-DD/TE-YYYY-MM-DD.epub`
- Produces: `data/issues.json` (IssueIndexData), `data/issues/TE-YYYY-MM-DD.json` (Issue)
- Produces: `public/images/covers/TE-YYYY-MM-DD.jpg`, `public/images/articles/TE-YYYY-MM-DD-NNNNN.jpg`
- Produces: `data/checksums.json` (for incremental mode)

- [ ] **Step 1: Write the parser**

```python
#!/usr/bin/env python3
"""Parse The Economist epub files into JSON for static site generation.

Usage: python3 scripts/parse_epubs.py

Input:  TE-YYYY-MM-DD/TE-YYYY-MM-DD.epub (27 issues)
Output: data/issues.json, data/issues/*.json, public/images/covers/, public/images/articles/
"""

import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re
import shutil
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ISSUES_DIR = ROOT
DATA_DIR = ROOT / 'data' / 'issues'
INDEX_PATH = ROOT / 'data' / 'issues.json'
CHECKSUMS_PATH = ROOT / 'data' / 'checksums.json'
COVERS_DIR = ROOT / 'public' / 'images' / 'covers'
ARTICLES_DIR = ROOT / 'public' / 'images' / 'articles'

XML_NS = {
    'dc': 'http://purl.org/dc/elements/1.1/',
    'opf': 'http://www.idpf.org/2007/opf',
    'xhtml': 'http://www.w3.org/1999/xhtml',
    'epub': 'http://www.idpf.org/2007/ops',
}

TAGS_TO_KEEP = {'p', 'b', 'strong', 'i', 'em', 'a', 'img', 'ul', 'ol', 'li',
                'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span'}

TAGS_TO_STRIP = {'div', 'body', 'html', 'head', 'title', 'meta', 'link'}


def slugify(text):
    """Convert text to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text[:80]


def find_issues():
    """Find all TE-YYYY-MM-DD directories with epub files."""
    issues = []
    for d in sorted(ISSUES_DIR.iterdir()):
        if not d.is_dir():
            continue
        match = re.match(r'TE-(\d{4}-\d{2}-\d{2})', d.name)
        if not match:
            continue
        epub = d / f'{d.name}.epub'
        if epub.exists():
            issues.append((match.group(1), epub))
    return issues


def load_checksums():
    if CHECKSUMS_PATH.exists():
        with open(CHECKSUMS_PATH) as f:
            return json.load(f)
    return {}


def save_checksums(checksums):
    with open(CHECKSUMS_PATH, 'w') as f:
        json.dump(checksums, f, indent=2)


def compute_sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def parse_epub(date_str, epub_path):
    """Parse a single epub file and return an Issue dict."""
    issue_id = f'TE-{date_str}'
    print(f'  Parsing {issue_id}...')

    with zipfile.ZipFile(epub_path) as z:
        # 1. Find content.opf
        container = ET.fromstring(z.read('META-INF/container.xml'))
        rootfile = container.find('.//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile')
        opf_path = rootfile.get('full-path')

        # 2. Parse metadata
        opf = ET.fromstring(z.read(opf_path))
        title_el = opf.find('.//dc:title', XML_NS)
        date_el = opf.find('.//dc:date', XML_NS)
        title = title_el.text if title_el is not None else issue_id
        if date_el is not None and date_el.text:
            try:
                pub_date = date_el.text[:10]
            except (ValueError, IndexError):
                pub_date = date_str
        else:
            pub_date = date_str

        # 3. Parse nav.xhtml for TOC
        nav_tree = parse_nav(z)
        sections = nav_tree

        # 4. Parse HTML content for each article
        all_html_files = [n for n in z.namelist() if n.startswith('index_split_') and n.endswith('.html')]
        html_content = {}
        for name in all_html_files:
            html = z.read(name).decode('utf-8')
            html_content[name] = clean_html(html)

        # 5. Fill articles with content
        for section in sections:
            for article in section['articles']:
                html_file = article.get('_htmlFile', '')
                if html_file in html_content:
                    article['contentHtml'] = html_content[html_file]
                    article['wordCount'] = count_words(article['contentHtml'])
                else:
                    article['contentHtml'] = ''
                    article['wordCount'] = 0
                del article['_htmlFile']

        # 6. Extract images
        os.makedirs(COVERS_DIR, exist_ok=True)
        os.makedirs(ARTICLES_DIR, exist_ok=True)

        # Cover image
        cover_dest = COVERS_DIR / f'{issue_id}.jpg'
        if 'cover.jpeg' in z.namelist():
            with z.open('cover.jpeg') as src, open(cover_dest, 'wb') as dst:
                dst.write(src.read())

        # Article images
        image_map = {}
        for name in z.namelist():
            if name.startswith('images/') and not name.endswith('/'):
                img_num = Path(name).stem
                dest_name = f'{issue_id}-{img_num}.jpg'
                dest_path = ARTICLES_DIR / dest_name
                with z.open(name) as src, open(dest_path, 'wb') as dst:
                    dst.write(src.read())
                image_map[name] = f'/images/articles/{dest_name}'

        # Rewrite image srcs in article content
        for section in sections:
            for article in section['articles']:
                html = article['contentHtml']
                for old_path, new_path in image_map.items():
                    html = html.replace(f'src="{old_path}"', f'src="{new_path}"')
                    html = html.replace(f"src='{old_path}'", f"src='{new_path}'")
                article['contentHtml'] = html
                article['images'] = [new_path for old_path, new_path in image_map.items()
                                     if old_path in article['contentHtml']]

    return {
        'id': issue_id,
        'title': title.replace('The Economist: ', '').replace('The Economist', '').strip(),
        'date': pub_date,
        'coverImage': f'/images/covers/{issue_id}.jpg',
        'sections': sections,
    }


def parse_nav(z):
    """Parse nav.xhtml to build section/article TOC structure."""
    if 'nav.xhtml' not in z.namelist():
        return []

    nav_html = z.read('nav.xhtml').decode('utf-8')
    root = ET.fromstring(nav_html)

    sections = []
    nav_ol = root.find('.//{http://www.w3.org/1999/xhtml}nav/{http://www.w3.org/1999/xhtml}ol')
    if nav_ol is None:
        nav_ol = root.find('.//{http://www.w3.org/1999/xhtml}ol')
    if nav_ol is None:
        return []

    for top_li in nav_ol.findall('{http://www.w3.org/1999/xhtml}li'):
        # top_li: <li><a>Section Name</a><ol><li><a>Article</a></li>...</ol></li>
        top_a = top_li.find('{http://www.w3.org/1999/xhtml}a')
        if top_a is None:
            continue
        section_name = (top_a.text or '').strip()
        if not section_name:
            continue

        section_slug = slugify(section_name)
        articles = []

        sub_ol = top_li.find('{http://www.w3.org/1999/xhtml}ol')
        if sub_ol is not None:
            for sub_li in sub_ol.findall('{http://www.w3.org/1999/xhtml}li'):
                sub_a = sub_li.find('{http://www.w3.org/1999/xhtml}a')
                if sub_a is None:
                    continue
                article_title = (sub_a.text or '').strip()
                html_file = sub_a.get('href', '')
                if article_title:
                    article_slug = slugify(article_title)
                    articles.append({
                        'id': f'{article_slug}',
                        'slug': article_slug,
                        'title': article_title,
                        'section': section_slug,
                        'issueId': '',
                        'date': '',
                        'contentHtml': '',
                        'images': [],
                        'wordCount': 0,
                        '_htmlFile': html_file,
                    })

        if articles:
            sections.append({
                'name': section_name,
                'slug': section_slug,
                'articles': articles,
            })

    return sections


def clean_html(html):
    """Extract body content, strip calibre classes, keep semantic tags."""
    # Extract <body>...</body>
    body_match = re.search(r'<body[^>]*>(.*)</body>', html, re.DOTALL)
    if not body_match:
        return ''
    body = body_match.group(1)

    # Remove class attributes (calibre classes)
    body = re.sub(r'\s+class="[^"]*"', '', body)

    # Strip non-semantic wrapper tags but keep their content
    for tag in TAGS_TO_STRIP:
        body = re.sub(rf'<\s*{tag}[^>]*>', '', body, flags=re.IGNORECASE)
        body = re.sub(rf'<\s*/\s*{tag}\s*>', '', body, flags=re.IGNORECASE)

    # Remove anchor tags without meaningful content (calibre filepos anchors)
    body = re.sub(r'<a\s+id="[^"]*"></a>', '', body)
    body = re.sub(r'<a></a>', '', body)

    # Remove empty paragraphs
    body = re.sub(r'<p[^>]*>\s*</p>', '', body)

    # Clean up excessive whitespace
    body = re.sub(r'\n\s*\n', '\n', body)
    body = body.strip()

    return body


def count_words(html):
    text = re.sub(r'<[^>]+>', ' ', html)
    return len(text.split())


def main():
    print('=== The Economist Epub Parser ===')
    print()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    checksums = load_checksums()
    issues = find_issues()
    print(f'Found {len(issues)} issues')

    issue_metas = []
    parsed_count = 0
    skipped_count = 0

    for date_str, epub_path in issues:
        issue_id = f'TE-{date_str}'
        sha = compute_sha256(epub_path)

        if issue_id in checksums and checksums[issue_id] == sha:
            # Load existing JSON
            existing_path = DATA_DIR / f'{issue_id}.json'
            if existing_path.exists():
                with open(existing_path) as f:
                    issue = json.load(f)
                skipped_count += 1
                print(f'  {issue_id}: skipped (unchanged)')
                issue_metas.append({
                    'id': issue['id'],
                    'title': issue['title'],
                    'date': issue['date'],
                    'coverImage': issue['coverImage'],
                    'articleCount': sum(len(s['articles']) for s in issue['sections']),
                })
                continue

        issue = parse_epub(date_str, epub_path)
        issue['id'] = issue_id
        issue['date'] = date_str

        # Fill in issueId and date on each article
        for section in issue['sections']:
            for article in section['articles']:
                article['issueId'] = issue_id
                article['date'] = date_str
                # Ensure unique slugs by prefixing with issue id if needed
                article['id'] = f'{article["slug"]}-{issue_id}'
                article['slug'] = article['id']

        # Save per-issue JSON
        out_path = DATA_DIR / f'{issue_id}.json'
        with open(out_path, 'w') as f:
            json.dump(issue, f, ensure_ascii=False, indent=2)

        checksums[issue_id] = sha
        parsed_count += 1

        article_count = sum(len(s['articles']) for s in issue['sections'])
        issue_metas.append({
            'id': issue['id'],
            'title': issue['title'],
            'date': issue['date'],
            'coverImage': issue['coverImage'],
            'articleCount': article_count,
        })

    # Collect all unique section names
    all_sections_set = set()
    for meta in issue_metas:
        issue_path = DATA_DIR / f'{meta["id"]}.json'
        if issue_path.exists():
            with open(issue_path) as f:
                issue = json.load(f)
            for s in issue['sections']:
                all_sections_set.add(s['name'])

    # Save index
    index = {
        'issues': sorted(issue_metas, key=lambda x: x['date'], reverse=True),
        'allSections': sorted(all_sections_set),
    }
    with open(INDEX_PATH, 'w') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    save_checksums(checksums)

    print()
    print(f'Done: {parsed_count} parsed, {skipped_count} skipped, {len(issue_metas)} total')
    print(f'Output: {INDEX_PATH}')
    print(f'Output: {DATA_DIR}/')


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Run the parser**

```bash
python3 scripts/parse_epubs.py
```

Expected: Output shows 27 issues parsed, `data/issues.json` created, `data/issues/` populated, `public/images/covers/` and `public/images/articles/` have images.

- [ ] **Step 3: Verify output structure**

```bash
cat data/issues.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Issues: {len(d[\"issues\"])}'); print(f'Sections: {d[\"allSections\"]}')"
```

Expected: Shows 27 issues and list of section names.

- [ ] **Step 4: Verify a sample issue JSON**

```bash
python3 -c "
import json
with open('data/issues/TE-2026-07-04.json') as f:
    issue = json.load(f)
print(f'Title: {issue[\"title\"]}')
print(f'Sections: {len(issue[\"sections\"])}')
for s in issue['sections'][:3]:
    print(f'  {s[\"name\"]}: {len(s[\"articles\"])} articles')
print(f'First article content length: {len(issue[\"sections\"][0][\"articles\"][0][\"contentHtml\"])} chars')
"
```

Expected: Shows title, sections, and article content length > 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/parse_epubs.py data/ public/images/
git commit -m "feat: epub parser script with first run output"
```

---

### Task 4: Data Loading Layer

**Files:**
- Create: `src/lib/data.ts`

**Interfaces:**
- Consumes: `data/issues.json`, `data/issues/*.json`
- Produces: `getAllIssues()`, `getIssue(id)`, `getAllArticles()`, `getArticlesBySection(slug)`, `getIssueIndex()`, `getAllSections()`

- [ ] **Step 1: Write data loading module**

```ts
// src/lib/data.ts
import { Issue, IssueIndexData, Article, IssueMeta } from '@/types'
import indexData from '../../data/issues.json'

const issueIndex: IssueIndexData = indexData as IssueIndexData

export function getIssueIndex(): IssueIndexData {
  return issueIndex
}

export function getAllIssues(): IssueMeta[] {
  return issueIndex.issues
}

export function getAllSections(): string[] {
  return issueIndex.allSections
}

export function getIssue(id: string): Issue {
  const data = require(`../../data/issues/${id}.json`) as Issue
  return data
}

export function getAllArticles(): Article[] {
  const articles: Article[] = []
  for (const meta of issueIndex.issues) {
    const issue = getIssue(meta.id)
    for (const section of issue.sections) {
      for (const article of section.articles) {
        articles.push(article)
      }
    }
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date))
}

export function getArticlesBySection(sectionName: string): Article[] {
  const slug = sectionName.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '')
  const articles: Article[] = []
  for (const meta of issueIndex.issues) {
    const issue = getIssue(meta.id)
    for (const section of issue.sections) {
      if (section.slug === slug || section.name.toLowerCase() === sectionName.toLowerCase()) {
        for (const article of section.articles) {
          articles.push(article)
        }
      }
    }
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date))
}

export function getArticleBySlug(slug: string): Article | null {
  for (const meta of issueIndex.issues) {
    const issue = getIssue(meta.id)
    for (const section of issue.sections) {
      for (const article of section.articles) {
        if (article.slug === slug) {
          return article
        }
      }
    }
  }
  return null
}

export function getLatestArticles(count: number = 20): Article[] {
  return getAllArticles().slice(0, count)
}

export function getRelatedArticles(article: Article, count: number = 3): Article[] {
  const all = getAllArticles()
  return all
    .filter(a => a.slug !== article.slug && a.section === article.section)
    .slice(0, count)
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: data loading layer for issues and articles"
```

---

### Task 5: Root Layout with Fonts and Design Tokens

**Files:**
- Create: `src/app/globals.css` (replace placeholder)
- Modify: `src/app/layout.tsx` (replace placeholder)

**Interfaces:**
- Produces: Root layout with Google Fonts loaded, global CSS variables, editorial typography defaults.

- [ ] **Step 1: Write globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&family=Source+Serif+4:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  :root {
    --color-bg: #FFFFFF;
    --color-fg: #0A0A0A;
    --color-muted: #F5F5F5;
    --color-muted-fg: #525252;
    --color-accent: #E3120B;
    --color-border: #E5E5E5;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-fg);
    font-family: 'Source Serif 4', Georgia, serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Public Sans', sans-serif;
    font-weight: 700;
    line-height: 1.15;
  }

  h1 { font-size: 2.5rem; }
  h2 { font-size: 1.875rem; }
  h3 { font-size: 1.5rem; }

  @media (min-width: 768px) {
    h1 { font-size: 3rem; }
    h2 { font-size: 2.25rem; }
  }
}

@layer components {
  .article-content {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 1.125rem;
    line-height: 1.75;
    color: var(--color-fg);
  }

  .article-content p {
    margin-bottom: 1.25em;
  }

  .article-content p:first-child::first-letter {
    float: left;
    font-size: 4em;
    line-height: 0.85;
    padding-right: 0.15em;
    padding-top: 0.05em;
    font-weight: 600;
    color: var(--color-accent);
  }

  .article-content img {
    max-width: 100%;
    height: auto;
    margin: 1.5em auto;
    display: block;
  }

  .article-content blockquote {
    border-left: 3px solid var(--color-accent);
    padding-left: 1.5em;
    margin: 1.5em 0;
    font-size: 1.25rem;
    font-style: italic;
    color: var(--color-muted-fg);
  }

  .article-content a {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .article-content a:hover {
    color: #b80e08;
  }

  .section-badge {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-accent);
    padding: 0.125em 0.5em;
    border: 1px solid var(--color-accent);
  }

  .card-hover {
    transition: transform 150ms ease, box-shadow 150ms ease;
  }

  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}
```

- [ ] **Step 2: Write layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'The Economist Archive',
    template: '%s — The Economist Archive',
  },
  description: 'Browse weekly issues of The Economist with full articles, editorial design, and powerful search.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-te-fg antialiased">
        <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: root layout with editorial fonts and design tokens"
```

---

### Task 6: Header and Footer Components

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`

**Interfaces:**
- Produces: `<Header />` with logo text, search toggle, section nav. `<Footer />` with minimal links.

- [ ] **Step 1: Write Header component**

```tsx
// src/components/Header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import SectionNav from './SectionNav'

interface HeaderProps {
  sections: string[]
  onSearchOpen: () => void
}

export default function Header({ sections, onSearchOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-te-border">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        {/* Top bar: logo + search */}
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="font-heading text-xl font-bold tracking-tight text-te-fg sm:text-2xl">
              The Economist
            </span>
          </Link>

          <button
            onClick={onSearchOpen}
            className="flex items-center gap-2 rounded-full border border-te-border px-4 py-2 text-sm text-te-muted-fg transition-colors hover:border-te-fg hover:text-te-fg"
            aria-label="Open search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-xs border border-te-border rounded px-1.5 py-0.5 ml-1">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Section nav */}
        <SectionNav sections={sections} />
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Write SectionNav component**

```tsx
// src/components/SectionNav.tsx
'use client'

import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'

interface SectionNavProps {
  sections: string[]
}

export default function SectionNav({ sections }: SectionNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="border-t border-te-border py-2">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Link
          href="/"
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-te-muted-fg transition-colors hover:bg-te-muted hover:text-te-fg font-heading"
        >
          All
        </Link>
        {sections.map((section) => (
          <Link
            key={section}
            href={`/sections/${section.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '')}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-te-muted-fg transition-colors hover:bg-te-muted hover:text-te-fg font-heading"
          >
            {section}
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write Footer component**

```tsx
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
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/components/SectionNav.tsx
git commit -m "feat: header with section nav and search toggle, footer"
```

---

### Task 7: ArticleCard Component

**Files:**
- Create: `src/components/ArticleCard.tsx`

**Interfaces:**
- Consumes: `Article` type
- Produces: `<ArticleCard article={article} />` — clickable card with section badge, title, date, excerpt.

- [ ] **Step 1: Write ArticleCard**

```tsx
// src/components/ArticleCard.tsx
import Link from 'next/link'
import { Article } from '@/types'

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const excerpt = article.contentHtml
    ? article.contentHtml.replace(/<[^>]+>/g, '').slice(0, 180).trim() + '…'
    : ''

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="card-hover group block rounded-lg border border-te-border bg-white p-5 no-underline"
    >
      <div className="mb-2">
        <span className="section-badge">{article.section}</span>
      </div>

      <h3 className="mb-2 font-heading text-lg font-semibold leading-snug text-te-fg group-hover:text-te-red transition-colors">
        {article.title}
      </h3>

      <div className="mb-3 flex items-center gap-2 text-xs text-te-muted-fg font-mono">
        <time dateTime={article.date}>
          {new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{article.wordCount} words</span>
      </div>

      {excerpt && (
        <p className="text-sm leading-relaxed text-te-muted-fg line-clamp-3">
          {excerpt}
        </p>
      )}
    </Link>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ArticleCard.tsx
git commit -m "feat: ArticleCard component with section badge and excerpt"
```

---

### Task 8: Home Page

**Files:**
- Modify: `src/app/page.tsx` (replace placeholder)
- Create: `src/components/ArticleGrid.tsx`
- Create: `src/components/IssueTimeline.tsx`

**Interfaces:**
- Consumes: `getLatestArticles()`, `getAllIssues()`, `getAllSections()` from data layer
- Produces: Home page with hero article, section nav, article grid (2-3 col), issue timeline.

- [ ] **Step 1: Write ArticleGrid component**

```tsx
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
```

- [ ] **Step 2: Write IssueTimeline component**

```tsx
// src/components/IssueTimeline.tsx
import Link from 'next/link'
import { IssueMeta } from '@/types'

interface IssueTimelineProps {
  issues: IssueMeta[]
}

export default function IssueTimeline({ issues }: IssueTimelineProps) {
  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={`/issues/${issue.id}`}
            className="card-hover shrink-0 rounded-lg border border-te-border bg-white p-3 no-underline w-36"
          >
            <div className="mb-2 aspect-[3/4] overflow-hidden rounded bg-te-muted">
              <img
                src={issue.coverImage}
                alt={`Cover for ${issue.title}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-medium text-te-fg font-heading truncate">
              {issue.title}
            </p>
            <p className="text-xs text-te-muted-fg font-mono mt-0.5">
              {new Date(issue.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write Home page**

```tsx
// src/app/page.tsx
import { getLatestArticles, getAllIssues, getAllSections } from '@/lib/data'
import ArticleGrid from '@/components/ArticleGrid'
import IssueTimeline from '@/components/IssueTimeline'
import Header from '@/components/Header'
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
```

- [ ] **Step 4: Write HomeClient wrapper (for client-side search state)**

```tsx
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
```

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/ArticleGrid.tsx src/components/IssueTimeline.tsx src/components/HomeClient.tsx
git commit -m "feat: home page with hero, article grid, and issue timeline"
```

---

### Task 9: Article Page

**Files:**
- Create: `src/app/articles/[slug]/page.tsx`
- Create: `src/components/ArticleHero.tsx`
- Create: `src/components/ArticleBody.tsx`
- Create: `src/components/RelatedArticles.tsx`

**Interfaces:**
- Consumes: `getAllArticles()`, `getArticleBySlug()`, `getRelatedArticles()`
- Produces: Full article page with hero, editorial body, and related articles.

- [ ] **Step 1: Write ArticleHero**

```tsx
// src/components/ArticleHero.tsx
import { Article } from '@/types'

interface ArticleHeroProps {
  article: Article
}

export default function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <div className="mb-8">
      <span className="section-badge mb-3">{article.section}</span>

      <h1 className="font-heading text-3xl font-bold leading-tight text-te-fg sm:text-4xl md:text-5xl">
        {article.title}
      </h1>

      <div className="mt-4 flex items-center gap-2 text-sm text-te-muted-fg font-mono">
        <time dateTime={article.date}>
          {new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{article.wordCount} words</span>
        <span>·</span>
        <span>{article.issueId.replace('TE-', '')}</span>
      </div>

      {article.images.length > 0 && (
        <img
          src={article.images[0]}
          alt=""
          className="mt-6 w-full rounded-lg object-cover max-h-[500px]"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write ArticleBody**

```tsx
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
```

- [ ] **Step 3: Write RelatedArticles**

```tsx
// src/components/RelatedArticles.tsx
import { Article } from '@/types'
import ArticleCard from './ArticleCard'

interface RelatedArticlesProps {
  articles: Article[]
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <div className="mt-16 border-t border-te-border pt-8">
      <h2 className="mb-6 font-heading text-xl font-bold text-te-fg">
        More from this section
      </h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write Article page**

```tsx
// src/app/articles/[slug]/page.tsx
import { Metadata } from 'next'
import { getAllArticles, getArticleBySlug, getRelatedArticles, getAllSections } from '@/lib/data'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
      <>
        <Header sections={sections} onSearchOpen={() => {}} />
        <main className="py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Article not found</h1>
          <a href="/" className="text-te-red underline mt-4 inline-block">Back to home</a>
        </main>
        <Footer />
      </>
    )
  }

  const related = getRelatedArticles(article, 3)

  return (
    <>
      <Header sections={sections} onSearchOpen={() => {}} />
      <main className="py-8">
        <article>
          <ArticleHero article={article} />
          <ArticleBody contentHtml={article.contentHtml} />
        </article>
        <RelatedArticles articles={related} />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors. Build succeeds with ~500-800 static article pages.

- [ ] **Step 6: Commit**

```bash
git add src/app/articles/ src/components/ArticleHero.tsx src/components/ArticleBody.tsx src/components/RelatedArticles.tsx
git commit -m "feat: article page with editorial layout, hero, body, and related articles"
```

---

### Task 10: Section and Issue Pages

**Files:**
- Create: `src/app/sections/[name]/page.tsx`
- Create: `src/app/issues/[id]/page.tsx`

**Interfaces:**
- Consumes: `getAllSections()`, `getArticlesBySection()`, `getAllIssues()`, `getIssue()`
- Produces: Section listing pages, Issue detail pages.

- [ ] **Step 1: Write Section page**

```tsx
// src/app/sections/[name]/page.tsx
import { Metadata } from 'next'
import { getAllSections, getArticlesBySection } from '@/lib/data'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
  // Find the original section name
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
    <>
      <Header sections={sections} onSearchOpen={() => {}} />
      <main className="py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-te-fg">{sectionName}</h1>
          <p className="mt-2 text-te-muted-fg">{articles.length} articles</p>
        </div>
        <ArticleGrid articles={articles} />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Write Issue page**

```tsx
// src/app/issues/[id]/page.tsx
import { Metadata } from 'next'
import { getAllIssues, getIssue, getAllSections } from '@/lib/data'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
      <>
        <Header sections={sections} onSearchOpen={() => {}} />
        <main className="py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Issue not found</h1>
          <a href="/" className="text-te-red underline mt-4 inline-block">Back to home</a>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header sections={sections} onSearchOpen={() => {}} />
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
                {issue.sections.length} sections ·{' '}
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
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors. ~15 section pages + 27 issue pages generated.

- [ ] **Step 4: Commit**

```bash
git add src/app/sections/ src/app/issues/
git commit -m "feat: section and issue listing pages"
```

---

### Task 11: SearchOverlay Component

**Files:**
- Create: `src/components/SearchOverlay.tsx`
- Create: `src/lib/search.ts`

**Interfaces:**
- Consumes: `getAllArticles()` from data layer
- Produces: `<SearchOverlay />` with Fuse.js fuzzy search, keyboard navigation.

- [ ] **Step 1: Write search index builder**

```ts
// src/lib/search.ts
import Fuse from 'fuse.js'
import { getAllArticles } from './data'
import { SearchItem } from '@/types'

let searchIndex: Fuse<SearchItem> | null = null

export function getSearchIndex(): Fuse<SearchItem> {
  if (searchIndex) return searchIndex

  const articles = getAllArticles()
  const items: SearchItem[] = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    section: a.section,
    date: a.date,
    excerpt: a.contentHtml.replace(/<[^>]+>/g, '').slice(0, 200),
  }))

  searchIndex = new Fuse(items, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'excerpt', weight: 0.3 },
      { name: 'section', weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  })

  return searchIndex
}

export function searchArticles(query: string): SearchItem[] {
  if (!query.trim() || query.trim().length < 2) return []
  const fuse = getSearchIndex()
  const results = fuse.search(query.trim())
  return results.slice(0, 20).map((r) => r.item)
}
```

- [ ] **Step 2: Write SearchOverlay**

```tsx
// src/components/SearchOverlay.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { searchArticles } from '@/lib/search'
import { SearchItem } from '@/types'

interface SearchOverlayProps {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleChange = (value: string) => {
    setQuery(value)
    if (value.trim().length >= 2) {
      setResults(searchArticles(value))
    } else {
      setResults([])
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Search articles"
    >
      <div
        className="mx-auto mt-[10vh] max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-te-border px-5 py-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5 shrink-0 text-te-muted-fg"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-transparent font-heading text-lg text-te-fg outline-none placeholder:text-te-muted-fg"
          />
          <button
            onClick={onClose}
            className="text-sm text-te-muted-fg hover:text-te-fg font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {query.length < 2 && (
            <p className="py-8 text-center text-sm text-te-muted-fg">
              Type at least 2 characters to search
            </p>
          )}

          {query.length >= 2 && results.length === 0 && (
            <p className="py-8 text-center text-sm text-te-muted-fg">
              No articles found for &quot;{query}&quot;
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-te-border">
              {results.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/articles/${item.slug}`}
                    onClick={onClose}
                    className="block px-2 py-3 transition-colors hover:bg-te-muted rounded no-underline"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="section-badge text-xs">{item.section}</span>
                      <span className="text-xs text-te-muted-fg font-mono">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-te-fg">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-te-muted-fg line-clamp-2">
                      {item.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchOverlay.tsx src/lib/search.ts
git commit -m "feat: Fuse.js search overlay with keyboard support"
```

---

### Task 12: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: GitHub Pages deployment on push to main, weekly cron, and manual trigger.

- [ ] **Step 1: Write deploy workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  schedule:
    - cron: '37 1 * * 1'  # Every Monday at 01:37 UTC (off-peak: not :00/30)
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Parse epub files
        run: python3 scripts/parse_epubs.py

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
          commit_message: 'deploy: ${{ github.sha }}'
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Actions workflow for epub parse + build + deploy to Pages"
```

---

### Task 13: Final Integration and Build Verification

**Files:**
- Modify: `src/app/layout.tsx` (update metadata)

**Interfaces:**
- Produces: Final working build with all pages.

- [ ] **Step 1: Update layout.tsx with final metadata**

The `layout.tsx` already has the correct structure from Task 5. Verify it includes:
- Google Fonts import in globals.css ✓
- Metadata export ✓
- Proper body styling ✓

No changes needed.

- [ ] **Step 2: Full build**

```bash
npx tsc --noEmit
npm run build
```

Expected: TypeScript compiles clean. Build succeeds. Check `out/` directory contents:

```bash
echo "=== Output files ==="
ls out/
echo ""
echo "=== Article pages ==="
ls out/articles/ | wc -l
echo ""
echo "=== Section pages ==="
ls out/sections/ | wc -l
echo ""
echo "=== Issue pages ==="
ls out/issues/ | wc -l
```

- [ ] **Step 3: Verify output is complete**

Check that `out/index.html` exists (home page), article pages are in `out/articles/`, section pages in `out/sections/`, issue pages in `out/issues/`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "build: final integration, all pages generating"
```

---

### Task 14: Push to GitHub

**Note:** Git fetch times out in this environment due to large binary files. This task documents the commands the user runs locally.

- [ ] **Step 1: On your local machine, pull remote to merge histories**

```bash
cd /path/to/The_Economist
git pull origin main --allow-unrelated-histories
```

Expected: Merges local implementation with remote epub archive.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

Expected: All commits pushed. GitHub Actions deploys to Pages automatically.

- [ ] **Step 3: Verify deployment**

Visit `https://1998x-stack.github.io/The_Economist` — home page with hero, latest articles grid, search, and issue browser.
