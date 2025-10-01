# Static Articles Site

A static Next.js (App Router) site that renders Markdown articles with toggleable summary and full views. Designed for deployment to GitHub Pages using `next export`.

## Getting Started

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

## Base Path Notes

When deployed to `https://USERNAME.github.io/REPO_NAME`, the site automatically uses `/REPO_NAME` as the base path. Locally, the base path is omitted.
