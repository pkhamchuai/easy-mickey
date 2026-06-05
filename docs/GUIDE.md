## Full Process Guide

### Phase 1 — Accounts to Create

| Service | URL | Cost | Purpose |
|---|---|---|---|
| GitHub | github.com | Free | Stores your code |
| Vercel | vercel.com | Free | Hosts your website |

Sign up for both before starting. That's all you need.

---

### Phase 2 — Local Setup (WSL)

1. Open WSL terminal
2. Create project inside `~/projects/` — not on `/mnt/c/`
3. Run `npx create-next-app@latest hongyok-fansite` 
4. `cd hongyok-fansite` then `code .` to open VS Code
5. Run `claude` in the terminal — use Claude Code to build features
6. Test at `localhost:3000` in your Windows browser

---

### Phase 3 — GitHub

1. Create a **private** repo on github.com
2. Connect and push your project from WSL terminal
3. Every future change: edit → test locally → `git push`

> Private repo recommended since your code will reference the tools page structure.

---

### Phase 4 — Vercel Setup

1. vercel.com → New Project → Import your GitHub repo → Deploy
2. Your site is live at `yourproject.vercel.app` ✅
3. Go to **Settings → Environment Variables** → add:

```
API_TOKENS = XXX, YYY, ZZZ
```

4. Vercel → Deployments → **Redeploy** after adding env vars

---

### Phase 5 — Distributing Tokens

Send each person **only their own token** via LINE private message. Tell them to screenshot and save it on their phone. Don't share in group chats.

---

### Phase 6 — Using the Site

Each person opens the site → enters their token once → browser saves it → they never type it again unless they clear their browser.

---

### Ongoing Maintenance

| Task | Where | Touches code? |
|---|---|---|
| Update schedule | Edit JSON → `git push` | ✅ Yes |
| Revoke someone | Vercel env vars → remove their token → redeploy | ❌ No |
| Add someone new | Generate new token → Vercel env vars → redeploy | ❌ No |
| Token compromised | Replace it in Vercel env vars → redeploy → resend | ❌ No |

---

### Deployment Flow Forever

```
Edit in VS Code (WSL)
→ Test on localhost:3000
→ git push
→ Vercel auto-deploys in ~30 seconds
→ Live at yourproject.vercel.app
```

---

## Full Summary

| What | Detail |
|---|---|
| **Total cost** | $0 |
| **Domain** | yourproject.vercel.app (free) |
| **Setup time** | ~2–3 hours first time |
| **Deploy time after** | 30 seconds per push |
| **Security** | Per-person tokens in Vercel env vars |
| **Team** | 3 tokens — save on phone, share via LINE DM |