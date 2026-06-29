# SnapPro · "Sound in Film" lead-capture game

A zero-dependency web game for the St. Louis Science Center show. Attendees scan
a QR → enter their info → take a quick sound-in-film quiz → **spin to win** →
get a claim code to redeem a prize at the booth. Every play captures a
qualified lead; **everyone wins something**; the big prizes are paced so they
last the whole event.

## Run it
```bash
cd sound-game
node server.mjs
```
- **Player:** http://localhost:3000/
- **Admin dashboard:** http://localhost:3000/admin?key=snappro-admin

No `npm install` — it's plain Node (v18+). To expose the QR at the booth, run it
on a laptop/mini-PC on a local network (a dedicated travel router/hotspot is
recommended so it doesn't depend on venue Wi-Fi), and point the QR at that
machine's IP, e.g. `http://192.168.1.50:3000`.

## How the prize engine works (server-authoritative)
- The **browser never decides the prize** — it only animates the result the
  server already chose. Inspecting the page can't force a win.
- **Big/limited prizes (grand + mid)** use the **golden-ticket** method: at
  startup each unit is assigned a random time inside its own slice of the event
  window, so they're spread evenly across the whole show and **can't be drained
  early**. The first player after a ticket's time wins it.
- **Base prizes** (swag, discount card) are the always-available fallback, so
  nobody leaves empty-handed.
- All awards run under an in-process lock → no double-awarding the last item.
- **One email = one play** (replaying returns the same prize/code).

## Configure (`config.json`)
- `prizes[]` — edit names, `tier` (`grand` | `mid` | `base`), `total`, `icon`,
  and base `weight`. Set the real items + quantities here.
- `quiz[]` — questions, options, and `answer` index.
- `event.durationMin` — real event length (paces the golden tickets).
- `event.demoCompressMin` — set to e.g. `5` to squeeze all big prizes into a few
  minutes so you can **see grand prizes during testing**, then set back to `0`.
- `adminKey` — change before the event.

> Reset between tests by deleting `data/state.json` (re-seeds golden tickets).
> ⚠ Editing prizes/quiz after seeding requires a reset to take full effect.

## Admin dashboard
Live lead count, prizes redeemed, **inventory bars per prize**, recent entries,
**redeem-by-code** (staff confirm + hand over), and **CSV export** of all leads
(name, email, phone, ZIP, interest, role, consent, score, prize, code, redeemed).

## Compliance notes (have your team confirm)
- It's a **sweepstakes** → post short Official Rules (no purchase necessary, 18+,
  "while supplies last", sponsor, void where prohibited). Link is stubbed in the
  entry form.
- **Email opt-in** is an un-pre-checked, required checkbox (CAN-SPAM).
- Phone is **optional** (keeps you clear of stricter SMS/TCPA rules).

## Free deploy (shareable link for Jordan)
Netlify can't host this (it needs an always-on Node process; that single process
is what keeps the prize engine race-safe). Use a persistent host instead:

**Render (free):** push this `sound-game/` folder to a Git repo → render.com →
New + → Blueprint → pick the repo (`render.yaml` is included). If the repo also
holds the Remotion project, set the service **Root Directory = `sound-game`**.
Build `npm install`, start `npm start`. Railway/Fly work the same way.

- ⚠ **Data durability:** free hosts have an *ephemeral* disk — `data/state.json`
  resets on redeploy/restart/spin-down. Perfect for a **demo link**. For the
  **actual event**, run it on the booth laptop (local disk = durable, and it's
  already concurrency-proven), or add a persistent disk / external DB.
- Concurrency is safe on a single instance; do **not** scale the service to
  multiple instances (that would need the Supabase path below).

## Production / scale path
For multi-device or cloud hosting, the same logic ports to **Next.js + Supabase
(Postgres)**: move `state` into tables (`leads`, `prizes`, `golden_tickets`,
`plays`) and replace the in-process lock with a DB transaction
(`UPDATE prizes SET remaining = remaining - 1 WHERE id=? AND remaining>0`). For a
single-booth setup, the current single-process server is simpler and more robust
on flaky venue Wi-Fi.
