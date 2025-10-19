---
title: "How OpenGL works"
slug: "2025-09-30-static-sites-with-nextjs"
date: 2025-09-30
status: "draft"
tags: ["nextjs", "guides"]
summary: "How to export and deploy Next.js apps as static sites on GitHub Pages or any CDN."
coverImage: "./images/cover.png"
---

![Next.js Static Export Workflow](/images/2025-09-30-static-sites-with-nextjs/static-sites.svg)

Static site generation transforms your dynamic Next.js application into pre-built HTML, CSS, and JavaScript files that can be served from any web server or CDN.


## Why Static Exports Matter

Static exports unlock fast hosting options, predictable deployments, and a simpler runtime. With `next export`, you can deploy to GitHub Pages or any CDN without servers.

## Configure Next.js

To enable static exports, set `output: 'export'` in `next.config.js`. Combine this with a `basePath` when deploying to a project page on GitHub Pages.

```javascript
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
