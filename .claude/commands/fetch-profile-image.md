Fetch the latest profile image for หงษ์หยก from the CGM48 official site and update the fan site.

## Steps

1. Read `app/page.tsx` and find the current image `src` URL inside the profile image `<div>` (look for `cgm48official.com/assets/images/`).

2. Try to download the image using curl with browser headers:
```bash
curl -sL '<CURRENT_SRC_URL>' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' \
  -H 'Referer: https://cgm48official.com/' \
  -o public/hongyok-profile.png
```

3. Check the file size of `public/hongyok-profile.png`:
   - **Larger than 5 KB** → real image downloaded. Update `app/page.tsx` to use `src="/hongyok-profile.png"` (local file) instead of the external URL.
   - **5 KB or smaller** → server blocked the download (returns a tiny placeholder). Keep the external URL as-is, and report to the user.

4. If the user provides a new source URL (e.g. the CGM48 site updated to a new image path), repeat steps 2–3 with that URL. If the download succeeds, also remove the old `public/hongyok-profile.png` before saving the new one.

5. Report what changed: which URL is now in use and whether the image is served locally or externally.
