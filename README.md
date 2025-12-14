# 🧭 Articles & Collections Structure

This repository uses a **tree-based content structure** to organize all writing — subjects, subtopics, standalone articles, and multi-chapter collections. The goal is to keep everything human-readable, versionable, and easy to parse programmatically.

## Project architecture

- **Next.js App Router** (14.x) with static export (`output: "export"`) so builds produce a fully static `out/` directory.
- **Content loader** (`lib/content/*`): walks `content/`, classifies folders as standalone articles or collections, and converts markdown to HTML with syntax highlighting, KaTeX support, summaries, and headings metadata.
- **Prebuild step** (`scripts/prepare-content.mjs`): automatically runs before `npm run build` to rewrite intra-site markdown links, copy `images/` folders from content into `public/`, and normalize paths for GitHub Pages base paths.
- **Caches & feeds**: build writes `.cache/{content-tree,articles,collections}.json` for inspection and generates `public/sitemap.xml` and `public/rss.xml` for SEO/subscriptions.
- **UI shell** (`components/`, `app/layout.tsx`): renders navigation using the parsed subject tree and collections while keeping the site themeable via Tailwind and Radix primitives.

### 📂 Directory overview

```
content/
  Subject/
    Subsubject/
      Vertex-Array-Objects/          # ← Standalone Article
        index.md                     # main article content
        summary.md                   # summary/abstract
        images/cover.png             # optional assets (copied to /public/articles/...)

      Rendering-Pipeline/            # ← Collection (multi-chapter)
        index.md                     # collection metadata + summary
        01-introduction/
          index.md                 # chapter content
          summary.md               # chapter summary
          images/…                 # optional assets copied alongside the chapter
        02-vertex-processing/
          index.md
          summary.md
```

### 🧩 Article types

#### 📝 Standalone Article

A folder with:

* `index.md` — main markdown with frontmatter
* `summary.md` — short summary version

**Frontmatter example (`index.md`):**

```yaml
---
status: "draft"          # draft | published | archived
summary: "How Threshold Cryptography works in simple terms"
---
```

#### 📚 Collection

A folder with:

* `index.md` — overview of the entire collection (title, slug, description, optional cover)
* `Chapter1/` — each subfolder is one chapter

Each chapter folder can contain:

* `index.md` — main content (with title, slug, date, etc.)
* `summary.md` — summary of that chapter

If that is the case, then the folder is treated as an article, and the article name will be the folder name. Else, the folder may actually contain subfolders.

**Collection frontmatter (`index.md`):**

```yaml
---
status: "draft"          # draft | published | archived
summary: "A pragmatic route to 3–10× faster pipelines using caching and graph-aware jobs."
coverImage: "./images/cover.png"
---
```

**Chapter frontmatter (`chapters/01-introduction/index.md`):**

```yaml
---
status: "draft"          # draft | published | archived
summary: "A pragmatic route to 3–10× faster pipelines using caching and graph-aware jobs."
coverImage: "./images/intro.png"
---
```

### 🧠 Naming & ordering rules

* Folder names can have numeric prefixes (`01-`, `02-`) to define order visually.
* The parser automatically sorts chapters by:

  1. numeric prefix
  2. alphabetical order
* Article name uniqueness is implicitly treated using filesystem path uniqueness:

  * Standalone: `/articles/article-1/`
  * Collection: `/collections/:collectionSlug/`
  * Chapters: `/collections/:collectionSlug/:chapterSlug/`

### 🧮 Generated structure

When you run the site build:

* The parser walks through `/content/` and generates:

  * `.cache/content-tree.json` — hierarchical structure
  * `.cache/articles.json` — flattened list of all articles (standalones + chapters)
  * `.cache/collections.json` — all collections
* It also builds `sitemap.xml` and `rss.xml` in `/public/`.

### ✅ Writing workflow

1. Choose whether you're creating a **standalone article** or a **collection**.
2. Create the appropriate folder inside `/content/...`.
3. Write `index.md` and `summary.md`.
4. Add images locally and reference them via relative paths. The prebuild script will relocate `images/` folders into `public/{articles|collections}/...` and rewrite in-article links accordingly.
5. Commit — the parser takes care of everything else on build.

> 💡 Tip: You can preview the full parsed structure anytime by inspecting `.cache/content-tree.json` after running a build.

### 🎮 Embedding Simulations

You can embed interactive HTML/JS simulations directly in your articles:

1. Create a `simulations/` folder inside your article directory
2. Add your self-contained HTML file (e.g., `demo.html`)
3. Embed in markdown using an iframe:

```html
<iframe src="simulations/demo.html" width="100%" height="600px"></iframe>
```

The `simulations/` folder is automatically copied to `public/` by the prebuild script, making the files accessible at the correct URL path.

Iframes are automatically wrapped in a macOS-styled window with traffic light buttons for a polished look.

## Getting started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to see the site. Articles live in `content/` and are parsed at build time via `lib/content/*`.

### Hot Reload

The development server includes automatic hot reload for content:

- **Markdown changes**: Reload automatically on page refresh (no caching in dev mode)
- **Simulations/Images**: A file watcher copies updated assets to `public/` automatically

The watcher runs alongside Next.js when you use `npm run dev`.

## Building & exporting

Create a production build and generate the static export:

```bash
npm run build
```

`next.config.js` sets `output: "export"`, so `npm run build` writes the static site to `out/`. The `prebuild` hook runs `scripts/prepare-content.mjs` first to re-map internal links and copy content images.

## Deployment

- **GitHub Pages (default):** Push to `main` and the included workflow (`.github/workflows/pages.yml`) builds `out/` and deploys it. `REPO_NAME` is inferred from the repository for correct `basePath`/`assetPrefix` handling.
- **Custom domains:** Set `SITE_URL` during the build to generate canonical URLs, RSS, and sitemap links for your domain.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with content hot reload |
| `npm run dev:next` | Start Next.js dev server only (no watcher) |
| `npm run watch` | Run content watcher standalone |
| `npm run build` | Run prebuild, build, and export to `out/` |
| `npm run lint` | Run Next.js linting |

## Enabling article comments with Giscus

This project can render a dedicated [Giscus](https://giscus.app/) discussion thread on each article page. Configure the following environment variables (for example in `.env.local`) with the values generated by Giscus:

- `NEXT_PUBLIC_GISCUS_REPO`
