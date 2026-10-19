# Joshveer Grewal's research blog

Minimal Home and Writing site for https://joshveergrewal.com, built with GitHub Pages and Jekyll.

## Content

- `index.html`: homepage introduction.
- `blog/index.html`: writing archive; blank until a real post is published.
- `_posts/YYYY-MM-DD-slug.md`: published Markdown posts.
- `_layouts/`: shared page and article layouts.
- `assets/css/style.css`: white background, system font, and technical article styles.
- `assets/<post-slug>/`: public figures and files referenced by published posts.

Keep working drafts and source notes in the private local workspace outside this repository. This repository is public.

To publish a post, add its reviewed final Markdown to `_posts/` using this structure:

```markdown
---
title: "Your post title"
date: YYYY-MM-DD HH:MM:SS -0400
description: "A concise summary of the post."
tags: [ml-systems]
---

Your writing goes here.
```

Use the actual publication date and Detroit UTC offset (`-0400` during daylight saving time, `-0500` otherwise). Commit and push to `main` when publication is intended. GitHub Pages builds and deploys the site automatically.

Markdown supports tables, fenced code blocks, links, images, and footnotes. Use native HTML/MathML for equations when needed; adding a TeX renderer can be scoped to a future math-heavy post.

## Search and feeds

`jekyll-seo-tag` generates page titles, descriptions, canonical URLs, social metadata, and structured data. `jekyll-sitemap` generates `/sitemap.xml`, and `jekyll-feed` generates `/feed.xml`. `robots.txt` allows crawling. These make the site eligible for indexing; search engines decide whether and when to index it.

## Deployment

Publish from the `main` branch at the repository root in Settings → Pages. GitHub's supported Jekyll build handles the plugins configured in `_config.yml`. The repository contains no theme dependency, analytics, or custom server. A small standalone script animates the glider favicon through four actual Life generations at 500ms per step. It follows the glider to keep the pattern centered, pauses in hidden tabs, and uses the static SVG for reduced motion or when JavaScript is disabled. Browser tab-icon updates vary by browser.

Home also loads `assets/js/home-life.js`, a subtle gray (`#b8b8b8`) Game of Life canvas confined to equal-width desktop side margins around a centered reading column. At widths up to 900px, the animation sits in a 128px band at the bottom of the page, below the introduction. It stays in normal document flow so short and landscape screens scroll without overlapping the copy. The canvas is decorative, ignores pointer input, and pauses for reduced motion or hidden tabs. Writing and post pages do not include this canvas or its script.
