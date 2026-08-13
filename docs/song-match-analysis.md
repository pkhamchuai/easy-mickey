# Song Match analysis pipeline

This covers what happens after new songs or members are in the catalog: writing their feature
analysis, checking that the matching still ranks well, and redrawing the member taste network.
Entering the data itself is in `song-match-setup.md`.

Run everything from the repository root.

## Files

- `data/song-match-song-analysis.json` — curated features for each song. Committed. This is the
  only file the pipeline edits by hand.
- `lib/song-match/song-analysis.ts` — loads that file and keys it by song id for the game, the
  export button, and the network graph.
- `scripts/analyze-song-match-correlation.mjs` (`npm run analyze:song-match`) — scores past feedback
  runs and reports how well the live ranking parameters agree with players.
- `scripts/export-song-match-network.mjs` (`npm run export:song-match-network`) — draws the member
  taste network as SVG and PNG.
- `.local/` — exports and generated images. Gitignored, so these never land in a commit.

The catalog itself lives in Postgres on Vercel, not in the repository.
`data/song-match-catalog.json` is only the three-song fallback used before a database is connected.

## 1. Export the current data

1. Open `/tools` with a valid tools token and select **Song Match Data**.
2. Select **Export JSON** under *Export Song Match Results*.
3. Save the download to `.local/song-match/song-match-analysis-YYYY-MM-DD.json`.

The export holds every song and member (drafts included) plus every feedback run, with each run
already tagged by `answer-quality` so unreliable sessions can be told apart.

## 2. Find the songs that need analysis

Songs are matched to their analysis by catalog id, never by title, so this is the check that
matters:

```bash
node -e "
const c=require('./data/song-match-song-analysis.json');
const f=require('./.local/song-match/song-match-analysis-YYYY-MM-DD.json');
const have=new Set(c.songs.map(s=>s.id));
const missing=f.songs.filter(s=>!have.has(s.id));
console.log(missing.length ? missing.map(s=>s.id+'  '+s.artist+' — '+s.title+'  '+s.youtubeUrl).join('\n') : 'all songs have analysis');
"
```

A song with no entry still appears in the export, but with the empty placeholder
`{ tempo: null, moods: [], styles: [], notes: null, sources: [] }` from `SongMatchExport.tsx`. That
placeholder contributes nothing to similarity, so any member picking that song is scored on their
other two picks alone.

## 3. Research each new song

Look for the tempo, the release date, the credits, and enough of the lyrics to describe what the
song is actually about. Sources that have worked:

- Tempo — `bpm-database.tokyo`, `songbpm.com`, `getsongbpm.com`. Several sites block automated
  fetches; a search that surfaces the value in the result snippet is still usable.
- Credits and release date — Japanese Wikipedia, `j-lyric.net`, `utaten.com`, `uta-net.com`.
- Lyrics and meaning — `j-lyric.net`, `utaten.com`, fan translations and interpretation posts.

`akb48.fandom.com`, `stage48.net`, `48pedia.org` and `tunebat.com` refuse direct fetches. English
Wikipedia and `generasia.com` usually work.

Read the lyrics rather than the title. The tags describe the story, not the vibe of the title: for
example `Igai ni Mango` is tagged `emotional-restraint` and `growing-up` because the mango stands
for fruit that is not ripe yet.

## 4. Add the entry

Append to the `songs` array in `data/song-match-song-analysis.json` and set `updatedAt` to the
export's date. Conventions the existing entries follow:

- `id` is the catalog song id from the export. Older entries use slugs such as `nagiichi`; those
  predate the database and are matched by the same id lookup.
- `artist` and `title` are labels for humans. Nothing is matched on them.
- `tempo` is BPM, or `null` when no source held up. Do not estimate it — `missingValuePolicy` in the
  file's own `methodology` block says to use null, and a wrong BPM quietly distorts every
  comparison. Say so in `notes` when a value was searched for and not found.
- `energy` is `low` / `medium` / `high`, `valence` is `negative` / `mixed` / `positive`.
- `moods`, `styles`, `themes`, `settings`, `seasons` are conservative English kebab-case tags.
  Reuse a tag that already exists in the file before inventing one; a tag used once matches nothing.
  Roughly 3–5 moods, 2–4 styles, 4–7 themes.
- `confidence` is `high` when tempo, credits, and lyrics were all confirmed, `medium` when something
  is missing or inferred.
- `notes` is one or two sentences on what the song is about.
- `sources` is 3–4 URLs actually used.

Themes carry the most weight in scoring (1.25), then moods (1.0), styles (0.7), settings (0.6) and
seasons (0.5), with tempo contributing 10% of the final similarity. Tag inflation is the main way to
degrade the graph: every extra tag dilutes the vector, and tokens are IDF-weighted, so rare accurate
tags do more work than common ones.

Confirm the file still parses and that every catalog song now resolves, by re-running the check in
step 2.

## 5. Run the correlation analysis

Point `DEFAULT_FEEDBACK` at the top of `scripts/analyze-song-match-correlation.mjs` at the new
export, then:

```bash
npm run analyze:song-match -- --compact          # metrics plus the parameter grid
npm run analyze:song-match -- --compact --no-grid # metrics only
npm run analyze:song-match                        # adds a per-run breakdown
```

Useful flags: `--analysis <path>` to score against a different analysis file (handy for comparing
against `git show HEAD:data/song-match-song-analysis.json`), `--json <path>` to write a report.

`CURRENT` is the live behaviour: `behaviorWeight` and the rest must stay in step with the game's own
scoring code. The grid underneath is diagnostic. It reports the best parameters *for the runs
collected so far*, and with a few dozen runs it will happily overfit, so a higher-scoring row is a
reason to look, not a reason to edit. Changing the live weights means changing the game and
re-running the analysis, and it invalidates comparisons with earlier reports.

Read `top1` (how close the best-ranked member is to the player's real top 3), `Spearman` and
`NDCG@5`. A catalog-only update that adds no new feedback runs should barely move them; new songs
only affect the metrics once players have actually been offered them.

## 6. Export the member network

```bash
npm run export:song-match-network
```

This reads the **public** catalog over the network — published members only — and the local analysis
file, so run it after the analysis edits are saved. Output goes to
`.local/song-match/network/song-match-member-network-<catalog updatedAt in ICT>.<svg|png>`.

Options: `--neighbors` (edges per member, default 3), `--perplexity` (layout spread, default 6),
`--catalog-url`, `--analysis`, `--output`.

The date in the filename comes from the catalog's `updatedAt`, not from today, so editing the
catalog and re-exporting on the same day overwrites the previous image.

Open the PNG afterwards. Overlapping labels or a member stranded far from everyone are usually real
signals about the data rather than rendering faults.

### New members

`memberGroup()` infers the group from `CGM48` or `BNK48` in the member's name and throws
`Unknown member group` for anything else. A member whose name carries no group needs their catalog
id added to `MEMBER_GROUP_OVERRIDES` near the top of the script, next to the existing Khaimook and
Nisha entries.

## Editing the catalog outside the tools page

`/tools` is the normal way. When a field has to be fixed directly, the API takes a full-catalog
`PUT`, so read, edit, and write back the whole document:

```bash
set -a && . ./.env.local && set +a
TOKEN="${TOOLS_TOKENS%%,*}"
curl -s -H "x-tools-token: $TOKEN" \
  "https://easy-mickey.vercel.app/api/song-match/catalog?drafts=1" -o /tmp/catalog-backup.json
# edit a copy, then diff it against the backup before writing
curl -s -X PUT -H "x-tools-token: $TOKEN" -H "content-type: application/json" \
  --data-binary @/tmp/catalog-updated.json \
  "https://easy-mickey.vercel.app/api/song-match/catalog"
```

Because the write replaces the entire catalog, keep the backup, diff the payload against it first,
and confirm afterwards that the song and member counts came back unchanged. This writes to
production immediately; there is no staging copy.

## Checklist

1. Export from `/tools` into `.local/song-match/`.
2. List catalog songs with no analysis entry.
3. Research tempo, credits, release date, and lyrics for each.
4. Add the entries, reusing existing tags, and bump `updatedAt`.
5. Repoint `DEFAULT_FEEDBACK` and run the correlation analysis.
6. Re-run the network export and look at the PNG.
7. Commit `data/song-match-song-analysis.json` and the script change. `.local/` stays out of git.
