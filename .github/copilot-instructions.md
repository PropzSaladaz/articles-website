# AI Coding Agent Instructions

## Project Overview

This is a **statically-exported Next.js blog** designed for GitHub Pages deployment. Key architectural decisions:
- **App Router** with static generation (`output: 'export'`)
- **Runtime content parsing** at build time (not SSG per-page)
- **Dual view modes** (summary/full) with URL persistence and localStorage
- **Build-time asset generation** (sitemap, RSS, content cache)

## Core Architecture

### Content Pipeline (`lib/content.ts`)
- Articles are parsed **once at build time** with in-memory caching (`cachePromise`)
- Markdown frontmatter validation enforces `title` (string) and `date` (ISO8601)
- Auto-generates: HTML, reading time, TOC headings, summaries, slug from filename
- **Side effects**: Creates `.cache/articles.json`, `public/sitemap.xml`, `public/rss.xml`

### Base Path Handling (`next.config.js`)
- Uses `REPO_NAME` environment variable for GitHub Pages project deployment
- Local development: no base path, Production: `/${REPO_NAME}`
- **Critical**: All internal links must use Next.js `Link` component for proper prefixing

### View Mode System (`components/ViewPreferenceContext.tsx`)
- **Client-side only** context managing summary/full view toggle
- URL parameter `?view=summary|full` takes precedence over localStorage
- **Default logic**: article pages default to 'full', listing pages to 'summary'
- Router integration updates URL without page reload

## Development Patterns

### Content Creation
```yaml
# Required frontmatter in content/articles/*.md
---
title: "Article Title"           # Required: non-empty string
date: "2024-03-12"              # Required: ISO8601 date
slug: "custom-slug"             # Optional: defaults to filename
tags: ["nextjs", "guides"]      # Optional: string array
summary: "Custom summary"        # Optional: auto-generated if missing
cover: "/images/cover.svg"      # Optional: relative to /public
---
```

### Component Architecture
- `ArticleCard`: Displays in summary/full modes based on ViewPreferenceContext
- `MarkdownRenderer`: Wraps rehype-processed HTML with Tailwind typography
- `ArticleContent`: Conditional rendering for article pages vs. card views
- **Pattern**: Use React Context for view state, avoid prop drilling

### Markdown Processing (`lib/md.ts`)
- **Pipeline**: remark-parse → remark-gfm → remark-rehype → rehype-slug → rehype-autolink-headings
- **TOC extraction**: Only h2-h4 headings, uses github-slugger for consistency
- **HTML output**: Allows dangerous HTML for rich content embedding

## Build & Deployment

### Local Development
```bash
npm run dev          # Standard Next.js dev server
npm run build        # Build for production
npm run export       # Generate static files in ./out/
```

### GitHub Pages Workflow
- **Trigger**: Push to `main` branch automatically deploys
- **Environment**: `REPO_NAME` set from repository name in `.github/workflows/pages.yml`
- **Output**: Static files in `./out/` directory served from GitHub Pages

### Key Files Modified on Build
- `.cache/articles.json` - Article metadata cache
- `public/sitemap.xml` - Auto-generated from articles + tag pages
- `public/rss.xml` - RSS feed from article summaries

## Critical Conventions

1. **Never use absolute paths** in components - rely on Next.js Link and basePath
2. **Content loading is build-time only** - no runtime file system access
3. **View mode changes** must update both localStorage and URL params
4. **Markdown headings** use github-slugger format for anchor compatibility
5. **Tag pages** auto-generate routes via `getAllTags()` in build process

## Troubleshooting

- **Build failures**: Check frontmatter validation in `lib/content.ts:validateFrontmatter`
- **Routing issues**: Verify `trailingSlash: true` and basePath configuration
- **View mode not persisting**: Check ViewPreferenceContext provider wraps layout
- **Missing articles**: Ensure `.md` files in `content/articles/` with valid frontmatter