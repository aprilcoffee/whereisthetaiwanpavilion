# Where is the Taiwan Pavilion

Static site. No build, no backend, no dependencies.

```
index.html   restoration homepage and official signatory list
info.html    event archive, statements, timeline, and interactive archive
llms.txt     AI-readable project guide and source boundaries
style.css
app.js
CNAME        whereisthetaiwanpavilion.com
og.png       social share image (1200×630)
favicon.svg
```

## Where the signatures come from

Public sign-ups are closed. The site displays the finalized official signatory
list from Google Sheet `192PiLQA7J_N8hA4VwinRCdySIv6eet9pkX7UHWvRW5o`.

The optional live-update path reads that sheet through Google's gviz endpoint,
selecting only columns **D, E, F** (name / role / pavilion or organisation):

```
https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv&tq=select D,E,F
```

`CSV_URL` and `LIVE_UPDATE` are at the top of `app.js`. `LIVE_UPDATE` defaults
to `false`, so the finalized list is written directly in `index.html` and no
request is made. Set it to `true` later to refresh the list from the sheet every
30 seconds while the tab is visible.

**The sheet must stay shared as "anyone with the link can view"** — that is what
makes the endpoint readable. Which also means *everything on that sheet is
public*. The site requests only D:F, so its email column is never fetched or
rendered.

## Deploy

This site is meant to live in **its own repository**, so that
`whereisthetaiwanpavilion.com` serves it at the domain root with no redirect and
no subfolder in the path.

1. New public repo named `whereisthetaiwanpavilion`, these files at its root.
2. **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
3. **Settings → Pages → Custom domain** → `whereisthetaiwanpavilion.com` → Save.
   (The `CNAME` file already in the repo does the same thing.)
4. Wait for the DNS check to go green, then tick **Enforce HTTPS**.

DNS setup at the registrar is in `DNS-GODADDY.md`.

## Editing

The restoration message, acknowledgement list, and official signatory list are
in `index.html`. The timeline, both statements, and the archival game are in
`info.html`. Press coverage stays in `press.html`. Language switching is CSS
only.

If the title or description changes, update them in `index.html` and `info.html`
(`title`, `description`, `og:title`, `og:description`) and regenerate `og.png`
if the wording on the image is affected.
