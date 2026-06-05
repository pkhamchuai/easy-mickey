# 🌸 Easy Mickey — หงษ์หยก Fan Site

A personal fan website and tools hub for หงษ์หยก (Hongyok) of CGM48,  
built with Next.js and deployed on Vercel.

**Live site:** https://easy-mickey.vercel.app  
**Repository:** https://github.com/CGeek48/easy-mickey (private)

---

## Pages

| Page | URL | Access |
|---|---|---|
| Home | `/` | Public |
| Tools | `/tools` | Token only (direct URL) |
| 404 | automatic | — |

> The `/tools` page has no link anywhere on the site — access by direct URL only.

---

## Features

**Home (`/`)**
- หงษ์หยก official links (Facebook, Instagram, TikTok, CGM48 profile)
- Mickey's House fanbase links (Facebook, LINE OPC, X, TikTok, YouTube)
- 3-day event schedule table with tabbed navigation
- Twitter/X intent share button with pre-filled หงษ์หยก hashtags

**Tools (`/tools`) — token protected**
- Live cover image downloader — button: "Live cover image", fetches and saves the live cover image
- File downloader — paste any public image or video URL, saves to your device
- X post templates — two sets (public + staff-only), staff can add/remove/edit both from the tools page, stored in Vercel KV
- Schedule editor — add/remove/edit events from the tools page, stored in Vercel KV (replaces data/schedule.json)

---

## Links Reference

### หงษ์หยก Official
| Platform | URL |
|---|---|
| Facebook | https://www.facebook.com/hongyok.cgm48official |
| Instagram | https://www.instagram.com/hongyok.cgm48official/ |
| TikTok | https://www.tiktok.com/@hongyok.cgm48 |
| CGM48 Profile | https://cgm48official.com/members/hongyok |

### Mickey's House Fanbase
| Platform | URL |
|---|---|
| Facebook | https://www.facebook.com/profile.php?id=61577586834926 |
| LINE OPC | https://line.me/ti/g2/i7xB1nBz0U0f3AcE9pxEXcltH5ijKymdyJGo1g |
| X (Twitter) | https://x.com/Hongyokcgm48FC |
| TikTok | https://www.tiktok.com/@mickey.house.hong |
| YouTube | https://www.youtube.com/@HongyokMickeysHouse |

---

## Tech Stack

- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Puppeteer](https://pptr.dev/) — headless browser for screenshots
- [Vercel](https://vercel.com/) — hosting and deployment

---

## Local Development

**Requirements**
- Windows 11 with WSL2 (Ubuntu)
- Node.js 20+ installed in WSL
- VS Code with WSL extension
- Claude Code (optional)

**Setup**

```bash
# Clone inside WSL
git clone https://github.com/CGeek48/easy-mickey
cd easy-mickey

# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Add your API_TOKENS to .env.local

# Start dev server (localhost only)
npm run dev
```

Open `localhost:3000` in your Windows browser.

---

## Environment Variables

`.env.local` (never committed):
```
API_TOKENS=token1,token2,token3
```

For production: **Vercel Dashboard → Settings → Environment Variables**

---

## Deployment

Auto-deploys on every push to `main`:

```bash
git add .
git commit -m "your message"
git push
# Live at easy-mickey.vercel.app in ~30 seconds
```

---

## Access & Tokens

- Each authorized user has a unique token
- Tokens live only in Vercel env vars — never in code
- Send tokens via LINE DM only
- To revoke: remove token from Vercel env vars → redeploy
- To add user: generate new token → add to `API_TOKENS` → redeploy

---

## Project Structure

```
easy-mickey/
├── app/
│   ├── page.tsx              # Home — links + schedule + share
│   ├── tools/
│   │   └── page.tsx          # Tools — screenshot & downloader
│   ├── layout.tsx            # Thai font, global styles
│   └── not-found.tsx         # Custom 404
├── components/
│   ├── HongyokLinks.tsx      # Official + fanbase link buttons
│   ├── ScheduleTable.tsx     # Tabbed 3-day schedule
│   ├── TwitterIntent.tsx     # Pre-filled share button
│   ├── ScreenshotTool.tsx    # URL → PNG download
│   └── Downloader.tsx        # URL → file download
├── data/
│   └── schedule.json         # Event schedule (edit here)
├── pages/api/
│   └── screenshot.ts         # Puppeteer serverless route
├── public/
├── .env.example
├── .env.local                # Local secrets (gitignored)
└── .gitignore
```

---

## Updating the Schedule

Edit `/data/schedule.json` → push to GitHub. No code changes needed.

---

## Security

- Repo is private on GitHub
- `/tools` page has no public link — URL access only
- API routes validate token on every request
- `.env.local` is gitignored
- Dev server bound to `127.0.0.1` only (no LAN exposure)

---

## License

Personal fan project — not affiliated with CGM48, AKB48 Group, or iAM48.  
All idol-related content rights belong to their respective owners.

---

*สร้างด้วยความรักให้หงษ์หยก 🌸*