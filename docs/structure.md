# Site Structure — Easy Mickey

Last updated: 2026-08-13

Companion docs: `GUIDE.md`, `song-match-setup.md` (catalog setup and data entry),
`song-match-analysis.md` (song analysis, correlation, network graph).

---

## Pages

| Route | File | Access | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Public | Home — hero, links, schedule, share button, cards linking to GE 2026 and the Song Match pages |
| `/tweets` | `app/tweets/page.tsx` | Public | Public X post templates (read from KV, falls back to JSON) |
| `/hashtags` | `app/hashtags/page.tsx` | Public | Hashtag picker — grouped tags, click to build a set, 280-char counter |
| `/template` | `app/template/page.tsx` | Public (URL only) | Staff X post templates — supports `{date}` placeholder |
| `/ge-2026` | `app/ge-2026/page.tsx` | Public | GE 2026 event page — voting agenda, center songs, embedded videos |
| `/letmeknow-handshake` | `app/letmeknow-handshake/page.tsx` | Public | Handshake event rounds and lanes (hidden from home via `SHOW_HANDSHAKE_EVENT`) |
| `/single-images` | `app/single-images/page.tsx` | Public | CGM48 profile image picker — choose single + member, save the image |
| `/games/song-match` | `app/games/song-match/page.tsx` | Public | The Song Match game — pairwise song choices, then matching members |
| `/games/song-match/members` | `app/games/song-match/members/page.tsx` | Public | Every published member with their three picks |
| `/games/song-match/members/[memberId]` | `app/games/song-match/members/[memberId]/page.tsx` | Public | One member's three picks with playable videos |
| `/games/song-match/stats` | `app/games/song-match/stats/page.tsx` | Public | Per-song stats — how many members picked it and at which rank |
| `/tools` | `app/tools/page.tsx` | Protected | Live cover downloader, file downloader, Song Match export |
| `/tools/schedule` | `app/tools/schedule/page.tsx` | Protected | Schedule editor — add/remove/edit events, saves to KV |
| `/tools/song-match` | `app/tools/song-match/page.tsx` | Protected | Song Library — group, title, YouTube URL |
| `/tools/song-match/members` | `app/tools/song-match/members/page.tsx` | Protected | Member editor — name, image upload, three ranked songs, publish toggle |

Protected pages read `?token=` and render `TokenGate` when it is missing or unknown.

---

## App Directory

```
app/
├── layout.tsx                  # Root layout — Sarabun font, dark bg, Thai lang tag, metadata
├── globals.css                 # Global styles — dark theme, font-sans = Sarabun, scrollbar
├── page.tsx                    # Home page — hero + HongyokLinks + ScheduleTable + TwitterIntent + feature cards
├── favicon.ico
├── tweets/page.tsx             # Public tweet templates page
├── hashtags/page.tsx           # Hashtag picker with character counter
├── template/page.tsx           # Staff tweet templates page (URL only, supports {date})
├── ge-2026/page.tsx            # GE 2026 agenda and center songs
├── letmeknow-handshake/page.tsx # Handshake round schedule
├── single-images/page.tsx      # Profile image picker (SingleImagePicker)
├── games/
│   └── song-match/
│       ├── page.tsx            # The game (TasteMatchGame)
│       ├── stats/page.tsx      # Song popularity stats
│       └── members/
│           ├── page.tsx        # All published members and their picks
│           └── [memberId]/page.tsx # One member's picks with videos
├── tools/
│   ├── page.tsx                # Protected tools hub + Song Match export
│   ├── schedule/page.tsx       # Protected schedule editor
│   └── song-match/
│       ├── page.tsx            # Song Library editor
│       └── members/page.tsx    # Member editor
└── api/
    ├── download/route.ts       # Proxy file download (protected)
    ├── live-cover/route.ts     # Fetch live cover image (protected)
    ├── parse-images/route.ts   # Parse image URLs from a page (protected)
    ├── single-image/route.ts   # Resolve a member's single image from the CDN
    ├── schedule/route.ts       # GET/PUT schedule data to/from KV
    ├── templates/route.ts      # GET/PUT tweet templates to/from KV
    └── song-match/
        ├── catalog/route.ts    # GET public catalog, GET ?drafts=1 and PUT with a tools token
        ├── feedback/route.ts   # POST a finished game session, GET all runs with a tools token
        └── upload/route.ts     # Member image upload to Vercel Blob (protected)
```

---

## Components

```
components/
├── HongyokLinks.tsx         # Two link grids: official links + fanbase links
├── ScheduleTable.tsx        # Event list — reads from KV, falls back to schedule.json
├── TwitterIntent.tsx        # X/Twitter intent button with pre-filled hashtags, links to /hashtags
├── TokenGate.tsx            # Access gate form
├── Downloader.tsx           # URL → file save via /api/download proxy
├── LiveCoverDownloader.tsx  # Fetch + save live cover image via /api/live-cover
├── ScheduleEditor.tsx       # Full CRUD editor for schedule days/events, saves to KV
├── SingleImagePicker.tsx    # Pick a single + member, preview and save the profile image
└── song-match/
    ├── TasteMatchGame.tsx   # The game: mode choice, pair rounds, results, feedback
    ├── SongMatchEditor.tsx  # Staff editor for songs and members (one component, two sections)
    ├── SongMatchExport.tsx  # Export button — catalog + feedback + analysis as one JSON file
    └── YouTubePlayer.tsx    # Lazy thumbnail-first embed; starting one player stops the others
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

Server component. Renders a single `<a>` linking to `twitter.com/intent/tweet` with pre-filled text, plus a link to `/hashtags`.

### TokenGate

Client component. Renders the access gate form used on protected pages.

### Downloader

Client component. Accepts one or more URLs, downloads each via `/api/download` proxy, and saves the file locally via a blob URL. Shown on `/tools`.

### LiveCoverDownloader

Client component. Accepts a URL, fetches the image via `/api/live-cover`, and saves it. Shown on `/tools`.

### ScheduleEditor

Client component. Full CRUD for schedule days and events. Loads from `/api/schedule`, saves back via PUT. Used on `/tools/schedule`.

### SingleImagePicker

Client component. Single and member are chosen from hardcoded lists that mirror `/api/single-image`; adding a member means updating both.

### TasteMatchGame

Client component and the whole game. Loads the public catalog, offers **quick** (half the songs) or **detailed** (all songs) mode, and asks pairwise "which song do you prefer" questions. Progress is kept in `localStorage` against the catalog `version`, so a resumed game is discarded when staff change the catalog. At the end it ranks members by taste similarity and lets the player rate the result; the session is posted to `/api/song-match/feedback`.

### SongMatchEditor

Client component used by both staff Song Match pages via a `section` prop (`songs` or `members`). Group names come from a fixed `SONG_ARTISTS` list — a new group has to be added there. Member images upload through `/api/song-match/upload`; **Save All** writes the whole catalog with a `PUT`.

### SongMatchExport

Client component on `/tools`. Downloads catalog drafts, every feedback run, and the local song analysis as one `song-match-analysis-YYYY-MM-DD.json`, which is the input for the scripts in `scripts/`. See `song-match-analysis.md`.

---

## Song Match library

```
lib/song-match/
├── types.ts          # Catalog, member, comparison, and feedback types
├── db.ts             # Neon Postgres reads/writes; creates the schema on first access
├── catalog.ts        # normalizeCatalog (validation) and publicCatalog (published members only)
├── public-catalog.ts # Server-side catalog read with the fallback applied
├── game.ts           # Pair generation, adaptive rounds, member matching
├── network.ts        # Taste profiles and similarity — shared by the game and the graph script
├── song-analysis.ts  # Loads data/song-match-song-analysis.json, keyed by song id
├── stats.ts          # Per-song pick counts and ranks for the stats page
├── answer-quality.ts # Flags low-confidence sessions (e.g. one-sided answering)
└── youtube.ts        # Video id extraction and URL canonicalisation
```

`lib/tools-auth.ts` validates the `x-tools-token` header against `TOOLS_TOKENS` for every protected
Song Match route.

`normalizeCatalog` is the gatekeeper for writes: it rejects duplicate ids, picks pointing at missing
songs, more than three picks, and publishing a member without an image and exactly three songs.

---

## Data

```
data/
├── schedule.json                 # Fallback schedule — used when KV is unavailable
├── tweet-templates.json          # Fallback public tweet templates
├── tweet-templates-staff.json    # Fallback staff tweet templates
├── hashtag-templates.json        # Not referenced by the app; /hashtags has its own list
├── song-match-catalog.json       # Three-song fallback catalog — used before Postgres is connected
└── song-match-song-analysis.json # Curated per-song features (edited by hand, see song-match-analysis.md)
```

KV keys mirror the filenames: `schedule`, `tweet-templates-public`, `tweet-templates-staff`.

The live Song Match catalog lives in Postgres, not in `data/`. Tables are created on first access;
the equivalent SQL is kept in `db/migrations/001_song_match.sql`: `song_match_songs`,
`song_match_members`, `song_match_picks`, `song_match_meta`.

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

## Scripts

```
scripts/
├── analyze-song-match-correlation.mjs  # npm run analyze:song-match
└── export-song-match-network.mjs       # npm run export:song-match-network
```

Both read `data/song-match-song-analysis.json`; the first also reads a feedback export from
`.local/`, the second fetches the public catalog. `.local/` holds exports and generated images and
is gitignored. Full workflow in `song-match-analysis.md`.

---

## Auth

Protected pages require a valid credential. `TokenGate` handles the entry form; API routes validate
on every request — older routes compare `?token=` against `TOOLS_TOKENS`, Song Match routes use the
`x-tools-token` header via `lib/tools-auth.ts`.

The public game reaches only two endpoints: `GET /api/song-match/catalog` (published members only)
and `POST /api/song-match/feedback`. Draft data is never returned without a token.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TOOLS_TOKENS` | Yes | Comma-separated staff tokens — set in Vercel env vars, ask the project owner |
| `KV_REST_API_URL` | Yes (prod) | Vercel KV endpoint — injected automatically when KV is connected |
| `KV_REST_API_TOKEN` | Yes (prod) | Vercel KV auth token — injected automatically |
| `DATABASE_URL` or `POSTGRES_URL` | Song Match | Neon Postgres connection — without it the catalog falls back to `data/song-match-catalog.json` |
| `BLOB_READ_WRITE_TOKEN` | Song Match | Vercel Blob token for member image uploads |

---

## Not Yet Built

| Feature | Notes |
|---|---|
| Custom 404 | `app/not-found.tsx` |
