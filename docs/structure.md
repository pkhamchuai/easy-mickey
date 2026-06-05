# Site Structure — Easy Mickey

Last updated: 2026-06-05  
Custom commands: `.claude/commands/`

---

## Pages

| Route | File | Access | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Home — links, schedule, share button |
| `/tweets` | `app/tweets/page.tsx` | Public | X post templates (read from KV, falls back to JSON) |
| `/tools` | `app/tools/page.tsx` | Token only (query param) | Live cover downloader + file downloader + staff tweet templates |
| `/tools/schedule` | `app/tools/schedule/page.tsx` | Token only (query param) | Schedule editor — add/remove/edit events, saves to KV |

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
├── tools/
│   ├── page.tsx            # Token-gated tools hub
│   └── schedule/
│       └── page.tsx        # Token-gated schedule editor
└── api/
    ├── download/route.ts   # Proxy file download (requires x-tools-token header)
    ├── live-cover/route.ts # Fetch live cover image (requires token)
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
├── TokenGate.tsx            # Token input form — redirects to /tools?token=
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

Client component. Renders a token input form. On submit, redirects to `/tools?token=<value>`. Used on `/tools` and `/tools/schedule` to gate access.

### Downloader

Client component. Accepts one or more URLs, downloads each via `/api/download` proxy (sends `x-tools-token` header), and saves the file locally via a blob URL. Shown on `/tools`.

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

Token-gated pages check a `token` query param against `TOOLS_TOKENS` (comma-separated env var). No session — token must be present in the URL on every visit. `TokenGate` component handles the entry form.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TOOLS_TOKENS` | Yes | Comma-separated valid tokens for `/tools` access |
| `KV_REST_API_URL` | Yes (prod) | Vercel KV endpoint — injected automatically when KV is connected |
| `KV_REST_API_TOKEN` | Yes (prod) | Vercel KV auth token — injected automatically |

---

## Custom Claude Code Commands

```
.claude/commands/
└── fetch-profile-image.md   # /fetch-profile-image — re-downloads profile image when source URL changes
```

| Command | What it does |
|---|---|
| `/fetch-profile-image` | Downloads image from CGM48 site → saves to `public/hongyok-profile.jpg`. Falls back to external URL if server blocks the download. Accepts a new URL argument when the source path changes. |

---

## Not Yet Built

| Feature | Notes |
|---|---|
| Custom 404 | `app/not-found.tsx` |
| Tweet template editor | `app/tools/tweets/` directory exists but no page yet |
