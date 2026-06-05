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
| X Post Templates | `/tweets` | Public |
| Staff Templates | `/template` | Public (URL only) |
| Tools | `/tools` | Protected |
| Schedule Editor | `/tools/schedule` | Protected |

> `/template` and `/tools` have no links on the site — access by direct URL only.

---

## Features

**Home (`/`)**
- หงษ์หยก official links (Facebook, Instagram, TikTok, CGM48 profile)
- Mickey's House fanbase links (Facebook, LINE OPC, X, TikTok, YouTube)
- Event schedule (reads from KV, falls back to `data/schedule.json`)
- Twitter/X intent share button with pre-filled หงษ์หยก hashtags

**X Post Templates (`/tweets`) — public**
- Read-only list of public tweet templates from KV (`tweet-templates-public`)
- Click any template to open X with the text pre-filled

**Staff Templates (`/template`) — public URL**
- Read-only list of staff tweet templates from KV (`tweet-templates-staff`)
- Supports `{date}` placeholder (replaced with today's Thai date)
- Click any template to open X with the text pre-filled

**Tools (`/tools`) — protected**
- Live cover image downloader
- File downloader — paste any public image or video URL, saves to your device
- X post template editor — add/remove/edit both public and staff templates, stored in KV

**Schedule Editor (`/tools/schedule`) — protected**
- Add/remove/edit schedule days and events, saved to KV

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
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv) — KV store for schedule and tweet templates
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

# Create local env file (copy from a teammate or Vercel dashboard)
touch .env.local
# Add access tokens and optionally KV vars to .env.local

# Start dev server (localhost only)
npm run dev
```

Open `localhost:3000` in your Windows browser.

---

## Environment Variables

`.env.local` (never committed) — ask the project owner for the values.

For production: **Vercel Dashboard → Settings → Environment Variables**  
KV vars are injected automatically when Vercel KV is connected to the project.

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

## Access

- Each authorized user has a unique access credential
- Credentials live only in Vercel env vars — never in code
- Share credentials via LINE DM only
- To revoke: update env vars → redeploy
- To add user: generate new credential → update env vars → redeploy

---

## Project Structure

```
easy-mickey/
├── app/
│   ├── page.tsx              # Home — links + schedule + share
│   ├── tweets/
│   │   └── page.tsx          # Public tweet templates
│   ├── template/
│   │   └── page.tsx          # Staff tweet templates (URL only)
│   ├── tools/
│   │   ├── page.tsx          # Tools hub — protected
│   │   └── schedule/
│   │       └── page.tsx      # Schedule editor — protected
│   ├── api/
│   │   ├── download/         # Proxy file download
│   │   ├── live-cover/       # Fetch live cover image
│   │   ├── parse-images/     # Parse image URLs from a page
│   │   ├── schedule/         # GET/POST schedule to KV
│   │   └── templates/        # GET/POST tweet templates to KV
│   ├── layout.tsx            # Sarabun font, global styles
│   └── globals.css
├── components/
│   ├── HongyokLinks.tsx      # Official + fanbase link buttons
│   ├── ScheduleTable.tsx     # Event schedule (KV → JSON fallback)
│   ├── ScheduleEditor.tsx    # CRUD editor for schedule
│   ├── TwitterIntent.tsx     # Pre-filled share button
│   ├── TokenGate.tsx         # Access gate
│   ├── LiveCoverDownloader.tsx
│   └── Downloader.tsx        # URL → file download
├── data/
│   ├── schedule.json                # Fallback schedule
│   ├── tweet-templates.json         # Fallback public templates
│   └── tweet-templates-staff.json  # Fallback staff templates
├── public/
│   └── hongyok-profile.jpg
├── .env.local                # Local secrets (gitignored)
└── .gitignore
```

---

## Updating the Schedule

**Preferred:** Use the schedule editor at `/tools/schedule` — changes save to Vercel KV immediately, no deploy needed.

**Fallback:** Edit `/data/schedule.json` → push to GitHub. Used only when KV is unavailable.

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