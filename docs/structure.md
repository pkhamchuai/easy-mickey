# Site Structure — Easy Mickey

Last updated: 2026-06-05  
Custom commands: `.claude/commands/`

---

## Pages

| Route | File | Access | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Home — links, schedule, share button |
| `/tools` | _(not yet built)_ | Token only (direct URL) | Live cover image downloader + file downloader + X post templates |

---

## App Directory

```
app/
├── layout.tsx       # Root layout — Sarabun font, dark bg, Thai lang tag, metadata
├── globals.css      # Global styles — dark theme, font-sans = Sarabun, scrollbar
├── page.tsx         # Home page — hero + HongyokLinks + ScheduleTable + TwitterIntent
└── favicon.ico
```

---

## Components

```
components/
├── HongyokLinks.tsx   # Two link grids: official links + fanbase links
├── ScheduleTable.tsx  # All events in a single list with date + time per card
└── TwitterIntent.tsx  # X/Twitter intent button with pre-filled hashtags
```

### HongyokLinks

Server component. Two sections:

**หงษ์หยก Official** — Facebook, Instagram, TikTok, CGM48 Profile  
**Mickey's House Fanbase** — Facebook, LINE OPC, X (Twitter), TikTok, YouTube

Each link renders as a card with a colored icon circle and platform name. Links open in a new tab.

### ScheduleTable

Server component. Reads `data/schedule.json`, flattens all days into a single list (skipping "ไม่มีกำหนดการ" entries), and renders one card per event. Each card shows:
- Day label (e.g. "พฤ 5 มิ.ย.") + time on the left
- Title, location, and optional หงษ์หยก badge on the right
- Pink border/background tint when `hasHongyok: true`

### TwitterIntent

Server component. Renders a single `<a>` linking to `twitter.com/intent/tweet` with pre-filled text:  
`ร่วมเชียร์หงษ์หยก CGM48 ด้วยกัน! 🌸 #หงษ์หยก #CGM48 #MickeysHouse`

---

## Data

```
data/
└── schedule.json    # Event list — edit here to update schedule, no code change needed
```

### schedule.json shape

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

To mark a day with no events, add one entry with `"title": "ไม่มีกำหนดการ"` — it is filtered out by ScheduleTable automatically.

---

## Custom Claude Code Commands

```
.claude/commands/
└── fetch-profile-image.md   # /fetch-profile-image — re-downloads profile image when source URL changes
```

| Command | What it does |
|---|---|
| `/fetch-profile-image` | Downloads image from CGM48 site → saves to `public/hongyok-profile.png`. Falls back to external URL if server blocks the download. Accepts a new URL argument when the source path changes. |

---

## Planned / Not Yet Built

| Feature | Component | Notes |
|---|---|---|
| Tools page | `app/tools/page.tsx` | Token-protected, no public link |
| Live cover image downloader | `components/LiveCoverDownloader.tsx` | Button label: "Live cover image" — fetches and saves the image |
| File downloader | `components/Downloader.tsx` | URL → file save |
| X post templates | `components/TweetTemplates.tsx` | Two sets: public + staff-only. Staff can add/remove/edit both from the tools page. Data stored in Vercel KV. |
| Schedule editor | `components/ScheduleEditor.tsx` | Add/remove/edit schedule events from the tools page. Data stored in Vercel KV — replaces `data/schedule.json`. |
| Custom 404 | `app/not-found.tsx` | — |
