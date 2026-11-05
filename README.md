# Joshveer Grewal's research blog

Minimal Home and Writing site for https://joshveergrewal.com, built with GitHub Pages and Jekyll.

## Content

- `index.html`: homepage introduction.
- `blog/index.html`: writing archive; blank until a real post is published.
- `_posts/YYYY-MM-DD-slug.md`: published Markdown posts.
- `_layouts/`: shared page and article layouts.
- `assets/css/style.css`: system light/dark colors, system font, and technical article styles.
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

Publish from the `main` branch at the repository root in Settings → Pages. GitHub's supported Jekyll build handles the plugins configured in `_config.yml`. The repository contains no theme dependency, analytics, or custom server. A small standalone script animates the glider favicon through four actual Life generations at 500ms per step. It follows the glider to keep the pattern centered, pauses in hidden tabs, and uses a matching still PNG frame when paused or reduced motion is enabled. The theme-aware static SVG remains the fallback when JavaScript or canvas is unavailable. Browser tab-icon updates vary by browser.

Home also loads `assets/js/home-life.js`, a subtle gray (`#b8b8b8`) Game of Life canvas confined to equal-width desktop side margins around a centered reading column. At widths up to 900px, the animation sits in a 128px band at the bottom of the page, below the introduction. It stays in normal document flow so short and landscape screens scroll without overlapping the copy. The canvas is decorative, ignores pointer input, and pauses for reduced motion or hidden tabs. Writing and post pages do not include this canvas or its script.

## Automatic appearance

The site follows the device’s `prefers-color-scheme` setting, with white paper and dark text in light mode and inverted colors in dark mode. CSS controls all page colors; the homepage canvas repaints immediately on a theme change. The glider favicon uses crisp 32px PNG frames with explicit light/dark colors, including when animation is paused. It refreshes on appearance changes, visibility, focus, and page restoration. Its static SVG fallback also follows system appearance. Animation timing, centered glider motion, reduced-motion support, and hidden-tab pauses are preserved. Printing uses a light background.

## Reading

`reading/index.html` and the `_reading/` collection provide the paper shelf and individual notes. Each note has a normal `/reading/<slug>/` URL. The shelf enhances those links with selection, browser history, keyboard navigation, and a reduced-motion version. Paper notes can use a first-page thumbnail or a simple title-sheet fallback.

Start drafts outside the public checkout with `templates/reading-note.md`. Only move an approved note and its public thumbnail into `_reading/` and `assets/<paper-slug>/` when publication is authorized.

The first version has no inline cross-links between notes/posts, no Linked from section, and no Related papers section. Each note’s main title links directly to the original paper. The interface has no small numbered captions, author/year/category row, or separate source-link row. Revisit cross-links with Joshveer when working on a Reading note or paper-related Writing post.

The initial shelf contains FlashAttention, Attention Is All You Need, and the original Vision Transformer paper. Their note bodies and descriptions are deliberately blank. Only the approved entries and first-page thumbnails are public; private drafts, original PDFs, and illustrative preview examples remain outside this checkout.

The shelf uses upright, uncovered papers. A lightweight wheel controller (`assets/js/scroll.js`) adds a short ease-out to vertical page scrolling and horizontal gestures on the paper rail. Touch and keyboard scrolling remain native; code blocks, tables, nested widgets, zoom gestures, and reduced-motion preferences bypass damping.

Horizontal paper browsing snaps to the nearest centered paper after scrolling settles, updating the note and URL. Clicks and arrow keys also center the chosen paper. End spacing lets the first/last covers center, and wheel/swipe selection replaces the URL instead of filling browser history.

Held arrow navigation is paced to the cover transition and stops at the ends; releasing cancels automatic repeats. A short fixed position track shows the selected index in the full paper list, follows horizontal scroll progress, and hides for a single entry. It is separate from the centered cover.

Home profile links are text-only, set in 13px type like the navigation. They use the muted system-theme color, with 18px between links and 24px above the row.
