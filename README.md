# 🧭 Articles & Collections Structure

This repository uses a **tree-based content structure** to organize all writing — subjects, subtopics, standalone articles, and multi-chapter collections.
The goal is to keep everything human-readable, versionable, and easy to parse programmatically.

---

## 📂 Directory Overview

```
content/
  Subject/
    Subsubject/
      Vertex-Array-Objects/          # ← Standalone Article
        index.md                     # main article content
        summary.md                   # summary/abstract
        images/cover.png             # optional assets

      Rendering-Pipeline/            # ← Collection (multi-chapter)
        index.md                     # collection metadata + summary
        01-introduction/
          index.md                 # chapter content
          summary.md               # chapter summary
          images/…                 # optional assets
        02-vertex-processing/
          index.md
          summary.md
```

---

## 🧩 Article Types

### 📝 Standalone Article

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

### 📚 Collection

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

---

## 🧠 Naming & Ordering Rules

* Folder names can have numeric prefixes (`01-`, `02-`) to define order visually.
* The parser automatically sorts chapters by:

  1. numeric prefix
  2. alphabetical order
* Article name uniqueness is implicitly treated using filesystem path uniqueness:

  * Standalone: `/articles/article-1/`
  * Collection: `/collections/:collectionSlug/`
  * Chapters: `/collections/:collectionSlug/:chapterSlug/`

---

## 🧮 Generated Structure

When you run the site build:

* The parser walks through `/content/` and generates:

  * `.cache/content-tree.json` — hierarchical structure
  * `.cache/articles.json` — flattened list of all articles (standalones + chapters)
  * `.cache/collections.json` — all collections
* It also builds `sitemap.xml` and `rss.xml` in `/public/`.

---

## ✨ Quick Reference

| Type       | Folder structure     | Required files                                               | Output route                                             |
| ---------- | -------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Standalone | `/Topic/Article/`    | `index.md`, `summary.md`                                     | `/articles/:slug/`                                       |
| Collection | `/Topic/Collection/` | `index.md`, `chapters/**/index.md`, `chapters/**/summary.md` | `/collections/:slug/` and `/collections/:slug/:chapter/` |

---

## 🧰 Coming Soon: Boilerplate Generator

You’ll later add a CLI utility (e.g. `pnpm gen:article`) that automates:

* Creating the folder structure
* Pre-filling frontmatter templates
* Optionally adding a sample cover or placeholder diagrams

Example usage:

```bash
pnpm gen:article "Computer Science/3D Graphics/Rendering Pipeline" --collection
pnpm gen:article "Computer Science/3D Graphics/Vertex Array Objects" --standalone
```

---

## ✅ Writing Workflow

1. Choose whether you’re creating a **standalone article** or a **collection**.
2. Create the appropriate folder inside `/content/...`.
3. Write `index.md` and `summary.md`.
4. Add images locally and reference them via relative paths.
5. Commit — the parser takes care of everything else on build.

---

> 💡 Tip: You can preview the full parsed structure anytime by inspecting `.cache/content-tree.json` after running a build.

---

# Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to see the site. Articles live in `content/articles` and are parsed at build time.

## Building & Exporting

Create a production build and generate the static export:

```bash
npm run build
npm run export
```

The static files are emitted to the `out/` directory and can be served locally or deployed to GitHub Pages.

## GitHub Pages Deployment

1. Ensure GitHub Pages is configured to use GitHub Actions.
2. Push changes to the `main` branch. The included workflow (`.github/workflows/pages.yml`) builds the project and deploys the `out/` directory.
3. The workflow sets the `REPO_NAME` environment variable automatically from the repository name, ensuring the correct `basePath` and `assetPrefix` for project pages.

If you host the site under a different domain, set the `SITE_URL` environment variable during the build.

## Content Model

Articles are Markdown files with YAML frontmatter stored in `content/articles`. Required fields include `title`, `slug`, and `date`. Optional fields: `tags`, `summary`, and `cover`.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – build for production
- `npm run export` – generate static output for GitHub Pages
- `npm run lint` – run Next.js linting

## Enabling Article Comments with Giscus

This project can render a dedicated [Giscus](https://giscus.app/) discussion thread on each article page. Configure the following
environment variables (for example in `.env.local`) with the values generated by Giscus:

- `NEXT_PUBLIC_GISCUS_REPO`
- `NEXT_PUBLIC_GISCUS_REPO_ID`
- `NEXT_PUBLIC_GISCUS_CATEGORY`
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`

Optional environment variables with sensible defaults:

- `NEXT_PUBLIC_GISCUS_MAPPING` (default: `pathname`)
- `NEXT_PUBLIC_GISCUS_STRICT` (default: `0`)
- `NEXT_PUBLIC_GISCUS_REACTIONS_ENABLED` (default: `1`)
- `NEXT_PUBLIC_GISCUS_EMIT_METADATA` (default: `0`)
- `NEXT_PUBLIC_GISCUS_INPUT_POSITION` (default: `bottom`)
- `NEXT_PUBLIC_GISCUS_LANG` (default: `en`)
- `NEXT_PUBLIC_GISCUS_LOADING` (default: `lazy`)
- `NEXT_PUBLIC_GISCUS_THEME` (default: `preferred_color_scheme`)

When the required variables are set, a comments section appears below the full article view (it remains hidden when viewing the
summary or on non-article pages).

## Base Path Notes

When deployed to `https://USERNAME.github.io/REPO_NAME`, the site automatically uses `/REPO_NAME` as the base path. Locally, the base path is omitted.
