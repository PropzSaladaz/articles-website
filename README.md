# Articles Website

A static knowledge-publishing platform built with **Next.js 14** (App Router, static export). Write articles and collections in Markdown, commit, and the site builds itself — with math, interactive simulations, syntax-highlighted code, and a responsive reading experience.

---

## Table of Contents

- [Project Architecture](#project-architecture)
- [Directory Overview](#directory-overview)
- [Content Structure](#content-structure)
  - [Standalone Articles](#standalone-articles)
  - [Collections](#collections)
  - [Naming & Ordering](#naming--ordering)
- [Markdown Features](#markdown-features)
- [Embedding Simulations](#embedding-simulations)
- [Getting Started](#getting-started)
- [Building & Exporting](#building--exporting)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Scripts Reference](#scripts-reference)

---

## Project Architecture

| Layer | Description |
|-------|-------------|
| **Next.js 14 App Router** | Static export (`output: "export"`) — produces a fully static `out/` directory at build time. |
| **Content loader** (`lib/content/`) | Walks `content/`, classifies folders as standalone articles or collections, and converts Markdown to HTML. |
| **Markdown pipeline** (`lib/md.ts`) | unified/remark/rehype pipeline: GFM, math (KaTeX), directives, GitHub alerts, spoilers, code highlighting (Shiki), heading anchors, image handling, iframe wrapping. |
| **Prebuild script** (`scripts/prepare-content.mjs`) | Runs before every build and dev start. Copies `images/` and `simulations/` from `content/` into `public/`, rewrites in-article relative paths, generates `sitemap.xml` and `rss.xml`. |
| **Content watcher** (`scripts/watch-content.mjs`) | File watcher process (runs alongside `next dev`) that keeps `public/` in sync as you edit content. |
| **UI shell** (`components/`, `app/`) | Resizable sidebar, tree navigation, article reading shell, table of contents, reading progress bar, dark/light theme. |

### Build output

```
.cache/
  content-tree.json   ← hierarchical subject tree
  articles.json       ← flat list of all articles
  collections.json    ← flat list of all collections
out/                  ← static HTML/CSS/JS (GitHub Pages target)
public/
  sitemap.xml
  rss.xml
  articles/{slug}/images/
  collections/{slug}/images/
```

---

## Directory Overview

```
content/
  Subject/
    Sub-Subject/
      My-Article/                    # Standalone article
        index.md
        summary.md                   # Rich summary (shown in Summary view)
        images/
        simulations/

      My-Collection/                 # Collection (multi-chapter)
        index.md                     # Collection overview
        1-Chapter-One/
          index.md
          summary.md
          images/
        2-Chapter-Two/
          index.md

lib/
  md.ts                              # Markdown → HTML pipeline
  content/                           # Content loading, builders, types
  remark-*.ts                        # Custom remark plugins
  rehype-*.ts                        # Custom rehype plugins

styles/
  globals.css                        # Tailwind base + CSS variables + themes
  markdown.css                       # Markdown content styles

scripts/
  prepare-content.mjs                # Prebuild: copy assets + rewrite paths
  watch-content.mjs                  # Dev: file watcher for content changes
```

---

## Content Structure

### Standalone Articles

A folder with an `index.md` is treated as a standalone article.

```
My-Article/
  index.md       ← main content
  summary.md     ← rich summary (optional but recommended)
  images/        ← assets (auto-copied to public/)
  simulations/   ← interactive HTML demos (auto-copied to public/)
```

**`index.md` frontmatter:**

```yaml
---
status: "published"      # draft | published | archived
date: "2026-01-15"       # ISO date string
summary: "One-line description shown on article cards and in SEO metadata."
coverImage: "./images/cover.png"   # optional
---
```

> **Note:** The `summary` frontmatter field is a **short one-liner** for article cards and SEO. For a richer expandable summary shown when clicking the Summary button, create a `summary.md` file alongside `index.md`.

---

### Collections

A folder whose subfolders each contain an `index.md` is treated as a multi-chapter collection.

```
My-Collection/
  index.md            ← collection overview
  1-Introduction/
    index.md
    summary.md
  2-Deep-Dive/
    index.md
    summary.md
    images/
```

**Collection `index.md` frontmatter:**

```yaml
---
status: "published"
summary: "Short description used in collection cards."
coverImage: "./images/cover.png"
---
```

**Chapter `index.md` frontmatter:**

```yaml
---
status: "published"
date: "2026-01-15"
summary: "One-liner for this chapter's card."
---
```

---

### Naming & Ordering

- Folder names accept numeric prefixes (`1-`, `01-`, `2-`) to control sort order.
- Sorting priority: **numeric prefix → alphabetical**.
- The article/chapter title is automatically derived from the folder name (prefix stripped, hyphens → spaces, title-cased).
- Slugs are generated from the full filesystem path, so uniqueness is guaranteed by directory structure.

**URL patterns:**
- Standalone: `/articles/{slug}/`
- Collection overview: `/collections/{slug}/`
- Collection chapter: `/collections/{collection-slug}/{chapter-slug}/`

---

## Markdown Features

The pipeline supports a rich superset of standard Markdown:

| Feature | Syntax |
|---------|--------|
| **GitHub Flavored Markdown** | Tables, task lists, strikethrough, etc. |
| **Math (KaTeX)** | Inline: `$E = mc^2$` · Display: `$$…$$` |
| **Code blocks** | Fenced blocks with language tags — syntax highlighted via Shiki |
| **GitHub Alerts** | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` |
| **Spoilers** | `:::spoiler[Title]` … `:::` — animated accordion |
| **Section breaks** | `===` on its own line → strong horizontal rule with extra spacing |
| **Heading anchors** | `#` anchor links appear on hover for easy section linking |
| **Iframe simulations** | `<iframe src="simulations/demo.html">` — auto-wrapped in macOS-style window |
| **Images** | Standard `![alt](./images/img.png)` — auto-path-rewritten for prod/dev |

---

## Embedding Simulations

Interactive HTML/JS simulations can be embedded directly in articles:

1. Create a `simulations/` folder inside your article directory.
2. Place a self-contained HTML file inside (e.g. `demo.html`). Ensure all JS/CSS is inline or bundled — no external dependencies.
3. Embed in Markdown:

```html
<iframe src="simulations/demo.html" width="100%" height="600px"></iframe>
```

The prebuild script automatically copies `simulations/` to `public/` so the paths resolve correctly in production.

**What you get automatically:**
- macOS-style window chrome (dark title bar with traffic light buttons)
- Play / Pause button injected into the title bar
- `requestAnimationFrame` interception for pause/resume support

**Tips for simulation HTML files:**
- Remove any `padding` from `body` and set `border-radius: 0` on root card elements — the iframe window already provides the outer frame.

---

## Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The dev server runs alongside a content watcher that keeps `public/` in sync as you edit articles and simulations.

> **Note:** The first page visit in dev mode is slow (~5–7 s) because Next.js compiles pages on demand and the markdown pipeline is heavy. Subsequent visits within the same session are fast. In production, all pages are prerendered as static HTML at build time.

---

## Building & Exporting

```bash
npm run build
```

This runs:
1. `scripts/prepare-content.mjs` (prebuild hook) — copies assets, rewrites paths, generates sitemap/RSS
2. `next build` — compiles the app and generates the static `out/` directory

---

## Deployment

### GitHub Pages (default)

Push to `main`. The included workflow (`.github/workflows/pages.yml`) builds and deploys the `out/` directory automatically. `REPO_NAME` is inferred from the repository name for correct `basePath` / `assetPrefix` handling.

### Custom domain

Set `SITE_URL` during the build to generate correct canonical URLs, RSS feed links, and sitemap entries:

```bash
SITE_URL=https://yourdomain.com npm run build
```

---

## Environment Variables

Create a `.env` (or `.env.local`) file at the project root:

```env
# Repository name — used to set basePath for GitHub Pages hosting
# Leave empty if deploying to a root domain
NEXT_REPO_NAME=articles-website

# Giscus comments (optional) — get values from https://giscus.app/
NEXT_PUBLIC_GISCUS_REPO=owner/repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_...
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_...

# Custom domain for sitemap/RSS canonical URLs (optional)
SITE_URL=https://yourdomain.com
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server + content watcher (hot reload for assets) |
| `npm run dev:next` | Start Next.js dev server only (no watcher) |
| `npm run watch` | Run the content watcher standalone |
| `npm run build` | Prebuild assets → `next build` → static `out/` |
| `npm run start` | Serve the built Next.js output locally |
| `npm run lint` | Run Next.js ESLint checks |
