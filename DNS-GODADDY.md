# GoDaddy DNS setup for whereisthetaiwanpavilion.com

Goal: the browser address bar shows `whereisthetaiwanpavilion.com`, served
directly by GitHub Pages. **No forwarding, no redirect, no masking.**

> Do **not** use GoDaddy's *Forwarding* / *網域轉發* feature. That is the redirect
> you do not want — it either bounces visitors to the github.io address or hides
> the real site inside a frame. Everything below is plain DNS.

## 1. Open the DNS editor

GoDaddy → **My Products** → find the domain → **DNS** → **Manage DNS**.

## 2. Delete the parking records

A fresh GoDaddy domain ships with a parked page. Remove:

- the **A** record with Name `@` pointing at a GoDaddy IP (often `Parked`)
- the **CNAME** record with Name `www` pointing at something like
  `<domain>.` or a GoDaddy host

Leave MX, TXT and NS records alone.

## 3. Add four A records

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 600 seconds |
| A | @ | 185.199.109.153 | 600 seconds |
| A | @ | 185.199.110.153 | 600 seconds |
| A | @ | 185.199.111.153 | 600 seconds |

All four. GitHub uses them for failover.

## 4. Add four AAAA records (IPv6 — recommended, not required)

| Type | Name | Value | TTL |
|---|---|---|---|
| AAAA | @ | 2606:50c0:8000::153 | 600 seconds |
| AAAA | @ | 2606:50c0:8001::153 | 600 seconds |
| AAAA | @ | 2606:50c0:8002::153 | 600 seconds |
| AAAA | @ | 2606:50c0:8003::153 | 600 seconds |

## 5. Add one CNAME for www

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | www | aprilcoffee.github.io | 600 seconds |

Note: the **username**, not the repository name. GoDaddy may add the trailing dot
itself; either form is fine.

## 6. Back in GitHub

**Settings → Pages → Custom domain** → `whereisthetaiwanpavilion.com` → **Save**.

Because the apex is set as the custom domain, GitHub serves the apex directly and
`www.whereisthetaiwanpavilion.com` redirects to it. That is GitHub's own
redirect, not GoDaddy forwarding, and the address bar ends on the apex.

Wait until the DNS check shows a green tick, then tick **Enforce HTTPS**. The
certificate is issued automatically and can take anywhere from a few minutes to
24 hours.

## 7. Verify

```bash
dig +short whereisthetaiwanpavilion.com          # the four 185.199.x.153 addresses
dig +short www.whereisthetaiwanpavilion.com      # aprilcoffee.github.io …
curl -sI https://whereisthetaiwanpavilion.com/   # HTTP/2 200
```

DNS changes usually take 10–30 minutes at GoDaddy, occasionally a few hours.

## Troubleshooting

**"Domain does not resolve to the GitHub Pages server"** — DNS has not propagated
yet, or a parking A record was left behind. Re-check step 2.

**"Enforce HTTPS" is greyed out** — the certificate is still being issued. Wait,
then reload the Pages settings page.

**The site loads but CSS is missing** — a stale `CNAME` or the files are in a
subfolder. All files belong at the repository root.
