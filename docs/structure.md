# Site Structure — Easy Mickey

Last updated: 2026-06-05  
Custom commands: `.claude/commands/`

---

## Pages

| Route | File | Access | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Home — links, schedule, share button |
| `/tweets` | `app/tweets/page.tsx` | Public | Public X post templates (read from KV, falls back to JSON) |
| `/template` | `app/template/page.tsx` | Public (URL only) | Staff X post templates — supports `{date}` placeholder |
| `/tools` | `app/tools/page.tsx` | Protected | Live cover downloader + file downloader + tweet template editor |
| `/tools/schedule` | `app/tools/schedule/page.tsx` | Protected | Schedule editor — add/remove/edit events, saves to KV |

---

## App Directory

```
app/
├── layout.tsx              # Root layout — Sarabun font, dark bg, Thai lang tag, metadata
├── globals.css             # Global styles — dark theme, font-sans = Sarabun, scrollbar
├── page.tsx                # Home page — hero + HongyokLinks + ScheduleTable + TwitterIntent
├── favicon.ico
├── tweets/
│   └── page.tsx            # Public tweet templates page
├── template/
│   └── page.tsx            # Staff tweet templates page (URL only, supports {date})
├── tools/
│   ├── page.tsx            # Protected tools hub
│   └── schedule/
│       └── page.tsx        # Protected schedule editor
└── api/
    ├── download/route.ts   # Proxy file download (protected)
    ├── live-cover/route.ts # Fetch live cover image (protected)
    ├── parse-images/route.ts # Parse image URLs from a page
    ├── schedule/route.ts   # GET/POST schedule data to/from KV
    └── templates/route.ts  # GET/POST tweet templates to/from KV
```

---

## Components

```
components/
├── HongyokLinks.tsx         # Two link grids: official links + fanbase links
├── ScheduleTable.tsx        # Event list — reads from KV, falls back to schedule.json
├── TwitterIntent.tsx        # X/Twitter intent button with pre-filled hashtags
├── TokenGate.tsx            # Access gate form
├── Downloader.tsx           # URL → file save via /api/download proxy
├── LiveCoverDownloader.tsx  # Fetch + save live cover image via /api/live-cover
└── ScheduleEditor.tsx       # Full CRUD editor for schedule days/events, saves to KV
```

### HongyokLinks

Server component. Two sections:

**หงษ์หยก Official** — Facebook, Instagram, TikTok, CGM48 Profile  
**Mickey's House Fanbase** — Facebook, LINE OPC, X (Twitter), TikTok, YouTube

Each link renders as a card with a colored icon circle and platform name. Links open in a new tab.

### ScheduleTable

Server component. Reads from KV key `schedule`, falls back to `data/schedule.json`. Flattens all days into a single list (skipping "ไม่มีกำหนดการ" entries), renders one card per event. Each card shows:
- Day label (e.g. "พฤ 5 มิ.ย.") + time on the left
- Title, location, and optional หงษ์หยก badge on the right
- Pink border/background tint when `hasHongyok: true`

### TwitterIntent

Server component. Renders a single `<a>` linking to `twitter.com/intent/tweet` with pre-filled text:  
`ร่วมเชียร์หงษ์หยก CGM48 ด้วยกัน! 🌸 #หงษ์หยก #CGM48 #MickeysHouse`

### TokenGate

Client component. Renders the access gate form used on protected pages.

### Downloader

Client component. Accepts one or more URLs, downloads each via `/api/download` proxy, and saves the file locally via a blob URL. Shown on `/tools`.

### LiveCoverDownloader

Client component. Accepts a URL, fetches the image via `/api/live-cover`, and saves it. Shown on `/tools`.

### ScheduleEditor

Client component. Full CRUD for schedule days and events. Loads from `/api/schedule`, saves back via POST. Used on `/tools/schedule`.

---

## Data

```
data/
├── schedule.json             # Fallback schedule — used when KV is unavailable
├── tweet-templates.json      # Fallback public tweet templates
└── tweet-templates-staff.json # Fallback staff tweet templates
```

KV keys mirror the filenames: `schedule`, `tweet-templates-public`, `tweet-templates-staff`.

### Schedule shape

```json
[
  {
    "date": "YYYY-MM-DD",
    "label": "short Thai label, e.g. พฤ 5 มิ.ย.",
    "events": [
      {
        "time": "HH:MM or —",
        "title": "event name",
        "location": "venue or empty string",
        "note": "short note or empty string",
        "hasHongyok": true
      }
    ]
  }
]
```

To mark a day with no events, add one entry with `"title": "ไม่มีกำหนดการ"` — filtered out by ScheduleTable automatically.

### Tweet template shape

```json
[
  { "id": "uuid", "label": "short display name", "text": "full tweet text" }
]
```

---

## Auth

Protected pages require a valid credential. `TokenGate` handles the entry form; API routes validate on every request.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| Access tokens | Yes | Set in Vercel env vars — ask the project owner |
| `KV_REST_API_URL` | Yes (prod) | Vercel KV endpoint — injected automatically when KV is connected |
| `KV_REST_API_TOKEN` | Yes (prod) | Vercel KV auth token — injected automatically |

---


## Not Yet Built

| Feature | Notes |
|---|---|
| Custom 404 | `app/not-found.tsx` |
