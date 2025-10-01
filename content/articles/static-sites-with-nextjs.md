---
title: Building Static Sites with Next.js
slug: static-sites-with-nextjs
date: 2024-03-12
tags:
  - nextjs
  - guides
summary: Learn how to configure Next.js for static exports, including base paths, sitemap generation, and GitHub Pages deployment.
cover: /images/static-sites.svg
---

## Why Static Exports Matter

Static exports unlock fast hosting options, predictable deployments, and a simpler runtime. With `next export`, you can deploy to GitHub Pages or any CDN without servers.

## Configure Next.js

To enable static exports, set `output: 'export'` in `next.config.js`. Combine this with a `basePath` when deploying to a project page on GitHub Pages.

```
/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: '/my-project',
  trailingSlash: true,
};

module.exports = config;
```

## Deploy to GitHub Pages

Use GitHub Actions to build and export. Upload the `out/` directory as a Pages artifact and deploy. Remember to set `REPO_NAME` so that asset paths resolve correctly.
