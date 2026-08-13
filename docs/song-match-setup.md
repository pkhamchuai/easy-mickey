# Song Match setup

The game is available at `/games/song-match`. Until a database is connected, it reads the Hongyok example from `data/song-match-catalog.json`.

## One-time Vercel setup

1. Open the project in Vercel and go to **Storage**.
2. Add a free **Neon Postgres** integration and connect it to this project.
3. Create a **Public Vercel Blob** store and connect it to this project.
4. Confirm that the project has these environment variables:
   - `DATABASE_URL` (or `POSTGRES_URL`)
   - `BLOB_READ_WRITE_TOKEN`
   - `TOOLS_TOKENS` (already used by the existing staff tools)
5. Redeploy the project after connecting the resources.

The API creates the Song Match tables automatically on first access. The equivalent SQL is also kept in `db/migrations/001_song_match.sql` for manual review or setup.

For local development, pull the connected environment variables with the Vercel CLI or add them to `.env.local` without committing the file.

## Entering data

1. Open `/tools` with a valid tools token.
2. Select **Song Match Data**.
3. Add each song once in **Song Library**, including title, artist/group, and YouTube URL.
4. Add a member, upload an image (JPEG, PNG, or WebP up to 3 MB), and select songs ranked 1–3.
5. Enable **Published** only when the member has an image and all three songs.
6. Select **Save All**.

The first save copies the currently displayed fallback data into Postgres. Later saves update the live catalog without a Git push or redeploy.

## Public data

`GET /api/song-match/catalog` returns published members only, along with the songs they use. Draft data requires the tools token and is never returned to the public game.

## After adding data

Writing the feature analysis for new songs, checking the ranking against collected feedback, and
redrawing the member taste network are covered in `song-match-analysis.md`.
