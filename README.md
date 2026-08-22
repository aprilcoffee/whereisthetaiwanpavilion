# Where is the Taiwan Pavilion

Static site. No build, no backend, no dependencies.

```
index.html   the open letter, signature link, live signatory list
info.html    background: timeline and sources
style.css
app.js
CNAME        whereisthetaiwanpavilion.com
og.png       social share image (1200×630)
favicon.svg
```

## Where the signatures come from

The signature form is Tally: <https://tally.so/r/9qAjlY>

Tally writes each response into a Google Sheet
(`1v-AJLfwnVQ6A7w-VrlO-FWN0B5818P9hzTBJdRJGlCE`). The site reads that sheet
through Google's gviz endpoint, selecting only columns **D, E, F**
(name / english name / occupation):

```
https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv&tq=select D,E,F
```

That URL is `CSV_URL` at the top of `app.js`. The page re-reads it every 30
seconds while the tab is visible, and the split-flap counter animates when the
number changes.

**The sheet must stay shared as "anyone with the link can view"** — that is what
makes the endpoint readable. Which also means *everything on that sheet is
public*. Right now it holds no email or contact column. **If you ever add one to
the Tally form, it becomes public the moment the first response lands.** In that
case, stop and put a mirror sheet in between (a separate spreadsheet pulling
only D:F via `IMPORTRANGE`, published to web as CSV).

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

The letter is in `index.html` — `<div class="en">`, `<div class="zh">`,
`<div class="ko">`. The short timeline is in `index.html`; the full one and the
sources are in `info.html`. Language switching is CSS only.

If the title or description changes, update them in **both** `index.html` and
`info.html` (`<title>`, `description`, `og:title`, `og:description`) and
regenerate `og.png` if the wording on the image is affected.
