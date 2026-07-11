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
    'ncx': 'http://www.daisy.org/z3986/2005/ncx/',
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


def parse_toc(z):
    """Parse TOC from nav.xhtml (EPUB 3) or toc.ncx (EPUB 2).

    Returns list of section dicts:
      {name, slug, articles: [{title, slug, htmlFile, ...}]}
    """
    if 'nav.xhtml' in z.namelist():
        return _parse_nav_toc(z)
    if 'toc.ncx' in z.namelist():
        return _parse_ncx_toc(z)
    return []


def _parse_nav_toc(z):
    """Parse nav.xhtml TOC.

    Handles both 3-level (wrapper > section > article) and
    2-level (section > article) structures.
    """
    nav_html = z.read('nav.xhtml').decode('utf-8')
    root = ET.fromstring(nav_html)

    X = 'http://www.w3.org/1999/xhtml'

    nav_ol = root.find(f'.//{{{X}}}nav/{{{X}}}ol')
    if nav_ol is None:
        nav_ol = root.find(f'.//{{{X}}}ol')
    if nav_ol is None:
        return []

    sections = []

    for top_li in nav_ol.findall(f'{{{X}}}li'):
        top_a = top_li.find(f'{{{X}}}a')
        if top_a is None:
            continue

        has_grandchild_ol = False
        sub_ol = top_li.find(f'{{{X}}}ol')
        if sub_ol is not None:
            for sub_li in sub_ol.findall(f'{{{X}}}li'):
                if sub_li.find(f'{{{X}}}ol') is not None:
                    has_grandchild_ol = True
                    break

        # Check if this is a wrapper (has sub-sections, i.e. grandchild articles)
        if has_grandchild_ol:
            # 3-level: top_li is wrapper, children are sections
            for section_li in sub_ol.findall(f'{{{X}}}li'):
                section_a = section_li.find(f'{{{X}}}a')
                if section_a is None:
                    continue
                section_name = (section_a.text or '').strip()
                if not section_name:
                    continue
                section_slug = slugify(section_name)
                articles = []

                article_ol = section_li.find(f'{{{X}}}ol')
                if article_ol is not None:
                    for article_li in article_ol.findall(f'{{{X}}}li'):
                        article_a = article_li.find(f'{{{X}}}a')
                        if article_a is None:
                            continue
                        article_title = (article_a.text or '').strip()
                        html_file = article_a.get('href', '')
                        if article_title and html_file:
                            article_slug = slugify(article_title)
                            articles.append({
                                'id': article_slug,
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
        else:
            # 2-level: top_li is a section directly
            section_name = (top_a.text or '').strip()
            if not section_name:
                continue
            section_slug = slugify(section_name)
            articles = []

            if sub_ol is not None:
                for sub_li in sub_ol.findall(f'{{{X}}}li'):
                    sub_a = sub_li.find(f'{{{X}}}a')
                    if sub_a is None:
                        continue
                    article_title = (sub_a.text or '').strip()
                    html_file = sub_a.get('href', '')
                    if article_title and html_file:
                        article_slug = slugify(article_title)
                        articles.append({
                            'id': article_slug,
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


def _parse_ncx_toc(z):
    """Parse toc.ncx TOC.

    Handles both 3-level (wrapper > section > article) and
    2-level (section > article) structures based on dtb:depth.
    """
    ncx_raw = z.read('toc.ncx')
    # toc.ncx may use a different namespace; try common ones
    ncx_ns_candidates = [
        'http://www.daisy.org/z3986/2005/ncx/',
        'http://www.daisy.org/z3986/2005/ncx',
    ]
    root = None
    for ns in ncx_ns_candidates:
        try:
            root = ET.fromstring(ncx_raw)
            if root.tag == f'{{{ns}}}ncx' or root.tag == 'ncx' or root.tag.endswith('}ncx'):
                break
        except ET.ParseError:
            continue
    if root is None:
        root = ET.fromstring(ncx_raw)

    # Detect the actual namespace from the root tag
    tag = root.tag
    if '}' in tag:
        ncx_ns = tag.split('}')[0].lstrip('{')
    else:
        ncx_ns = ''

    def _q(tag_name):
        return f'{{{ncx_ns}}}{tag_name}' if ncx_ns else tag_name

    # Determine depth from metadata
    depth = 0
    head = root.find(_q('head'))
    if head is not None:
        for meta in head.findall(_q('meta')):
            nm = meta.get('name', '')
            if nm == 'dtb:depth':
                try:
                    depth = int(meta.get('content', '0'))
                except (ValueError, TypeError):
                    depth = 0
                break

    nav_map = root.find(_q('navMap'))
    if nav_map is None:
        return []

    sections = []

    for top_np in nav_map.findall(_q('navPoint')):
        label_el = top_np.find(f'{_q("navLabel")}/{_q("text")}')
        top_name = (label_el.text or '').strip() if label_el is not None else ''
        if not top_name:
            continue

        child_nps = top_np.findall(_q('navPoint'))
        grandchild_nps = []
        for child_np in child_nps:
            grandchild_nps.extend(child_np.findall(_q('navPoint')))

        # depth 4 means 3-level: wrapper > section > article
        # depth 3 means 2-level: section > article
        if depth >= 4 and grandchild_nps:
            # 3-level: top_np is wrapper, children are sections
            for section_np in child_nps:
                sec_label = section_np.find(f'{_q("navLabel")}/{_q("text")}')
                section_name = (sec_label.text or '').strip() if sec_label is not None else ''
                if not section_name:
                    continue
                section_slug = slugify(section_name)
                articles = []

                for article_np in section_np.findall(_q('navPoint')):
                    art_label = article_np.find(f'{_q("navLabel")}/{_q("text")}')
                    article_title = (art_label.text or '').strip() if art_label is not None else ''
                    content_el = article_np.find(_q('content'))
                    html_file = content_el.get('src', '') if content_el is not None else ''
                    if article_title and html_file:
                        article_slug = slugify(article_title)
                        articles.append({
                            'id': article_slug,
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
        else:
            # 2-level: top_np is a section directly
            section_name = top_name
            section_slug = slugify(section_name)
            articles = []

            for article_np in child_nps:
                art_label = article_np.find(f'{_q("navLabel")}/{_q("text")}')
                article_title = (art_label.text or '').strip() if art_label is not None else ''
                content_el = article_np.find(_q('content'))
                html_file = content_el.get('src', '') if content_el is not None else ''
                if article_title and html_file:
                    article_slug = slugify(article_title)
                    articles.append({
                        'id': article_slug,
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

        # 3. Parse TOC
        sections = parse_toc(z)

        # 4. Parse HTML content for each article
        html_content = {}
        for section in sections:
            for article in section['articles']:
                html_file = article['_htmlFile']
                if html_file and html_file not in html_content:
                    try:
                        html = z.read(html_file).decode('utf-8')
                        html_content[html_file] = clean_html(html)
                    except KeyError:
                        # HTML file not found in zip
                        html_content[html_file] = ''

        # 5. Fill articles with content
        for section in sections:
            for article in section['articles']:
                html_file = article['_htmlFile']
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

        # Cover image (handle both cover.jpeg and cover.jpg)
        cover_dest = COVERS_DIR / f'{issue_id}.jpg'
        for cover_candidate in ['cover.jpeg', 'cover.jpg']:
            if cover_candidate in z.namelist():
                with z.open(cover_candidate) as src, open(cover_dest, 'wb') as dst:
                    dst.write(src.read())
                break

        # Article images: extract ALL image files from zip
        image_zid_counter = 0
        image_map = {}  # {zip_path: public_uri}
        for name in z.namelist():
            # Match any image file in standard image directories
            if not name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                continue
            # Skip cover images (already handled)
            if name == 'cover.jpeg' or name == 'cover.jpg':
                continue

            ext = Path(name).suffix if '.' in name else '.jpg'
            image_zid_counter += 1
            dest_name = f'{issue_id}-{image_zid_counter:05d}{ext}'
            dest_path = ARTICLES_DIR / dest_name
            try:
                with z.open(name) as src, open(dest_path, 'wb') as dst:
                    dst.write(src.read())
                image_map[name] = f'/images/articles/{dest_name}'
            except KeyError:
                pass

        # 7. Determine which images belong to each article BEFORE rewriting srcs
        for section in sections:
            for article in section['articles']:
                html = article['contentHtml']
                # Find all image src values currently in the HTML
                html_srcs = re.findall(r'<img[^>]+src="([^"]*)"', html)
                # Build candidate set including resolved ../ relative paths
                candidates = set(html_srcs)
                for src in html_srcs:
                    resolved = src
                    while resolved.startswith('../'):
                        resolved = resolved[3:]
                        candidates.add(resolved)
                article_images = []
                for old_path, new_path in image_map.items():
                    if old_path in html:
                        article_images.append(new_path)
                    else:
                        # Check if any candidate is a suffix of this zip path
                        # (handles relative references like "images/img.jpg" when
                        #  the zip path is "feed_X/article_Y/images/img.jpg", and
                        #  "../" relative paths)
                        for src in candidates:
                            if old_path.endswith(src):
                                article_images.append(new_path)
                                break
                article['images'] = article_images

        # 8. Rewrite image srcs in article content
        for section in sections:
            for article in section['articles']:
                html = article['contentHtml']
                # Collect (src, new_path) pairs from actual HTML references
                replacements = []
                for match in re.finditer(r'<img[^>]+src="([^"]*)"', html):
                    src = match.group(1)
                    # Determine the best old_path match (try direct, then resolved)
                    best_new_path = None
                    for old_path, new_path in image_map.items():
                        if old_path.endswith(src):
                            best_new_path = new_path
                            break
                    if best_new_path is None:
                        # Try resolving ../ relative paths
                        resolved = src
                        while resolved.startswith('../'):
                            resolved = resolved[3:]
                            for old_path, new_path in image_map.items():
                                if old_path.endswith(resolved):
                                    best_new_path = new_path
                                    break
                            if best_new_path is not None:
                                break
                    if best_new_path is not None:
                        replacements.append((src, best_new_path))
                # Deduplicate: if multiple images have the same src (edge case),
                # they should map to the same new_path — skip duplicates
                seen = set()
                for src, new_path in replacements:
                    key = (src, new_path)
                    if key not in seen:
                        seen.add(key)
                        html = html.replace(f'src="{src}"', f'src="{new_path}"')
                        html = html.replace(f"src='{src}'", f"src='{new_path}'")
                article['contentHtml'] = html

    return {
        'id': issue_id,
        'title': title.replace('The Economist: ', '').replace('The Economist', '').strip(),
        'date': pub_date,
        'coverImage': f'/images/covers/{issue_id}.jpg',
        'sections': sections,
    }


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
