# SnapPro "Sound in Film" — Event Setup Checklist

**Event:** St. Louis Science Center · 6:00–10:00 PM · ~1200 attendees
**The game runs on ONE laptop at your booth.** Attendees scan a QR → play on their own phones.

---

## ✅ Tested & ready

The prize engine was stress-tested before the event and passed:
- All **7 Amazon Alexas** release evenly across the 4 hours (never early, never more than 7).
- **Everyone wins** something — no one gets nothing.
- Meyer + Unilumin prizes are unlimited "while supplies last" (no pacing).
- Claim codes are unique; one email = one play; concurrent players can't double-win.
- Admin dashboard, code redemption, and CSV export all work.

---

## 1. What to bring

- [ ] **The booth laptop** (Windows, with this `sound-game` folder on it)
- [ ] **A travel Wi-Fi router** (cheap one is fine — it does NOT need internet)
- [ ] Laptop charger + a power strip
- [ ] **Printed QR poster(s)** for the booth (see Step 4)
- [ ] The physical prizes + a way to track/hand them out
- [ ] Optional: a second screen/tablet to show a big QR

> **Why a router and not venue Wi-Fi / cell?** The laptop is the source of truth (all leads + prize counts live on its disk). A dedicated router means the game works **fully offline** — no dead spots, no cell signal needed, nothing resets. This is the recommended setup for 1200 people.

---

## 2. The night before (do this at home/office with internet)

- [ ] Double-click **`START-GAME.bat`** — a black window opens and stays open. Leave it.
- [ ] Open **http://localhost:3000/** in a browser and **play one full round** (form → quiz → spin the wheel → win). Confirm the wheel spins and you get a prize + code.
- [ ] Open the **admin**: http://localhost:3000/admin?key=snappro-admin — confirm your test play shows up.
- [ ] Close the black window when done (this stops the server).
- [ ] Charge the laptop fully.

---

## 3. At the venue — before doors open

**a) Network**
- [ ] Power on the travel router. Name the Wi-Fi something obvious like **`SnapPro-Game`**.
- [ ] Connect the **laptop** to that router's Wi-Fi.
- [ ] Find the laptop's address: open **Command Prompt**, type `ipconfig`, press Enter. Look for **IPv4 Address** — it looks like `192.168.x.x`. **Write it down.**

**b) Make/verify the QR** (points phones at the laptop)
- [ ] On the laptop, open **http://localhost:3000/qr** in a browser.
- [ ] In the box, type your address with the port: **`http://192.168.x.x:3000/`** (use the number from `ipconfig`) and click **Update**.
- [ ] Click **Print** (or take a photo/screenshot) → that's your booth QR poster. This page works with **no internet**.
- [ ] Test it: on **your phone**, join the `SnapPro-Game` Wi-Fi, scan the QR — the game should open.

---

## 4. 🚦 Opening the doors (the ONE important step)

The 7 Alexas are timed to spread across **4 hours starting when the server starts**. So start it **fresh right at 6:00 PM**, not earlier.

- [ ] At **6:00 PM**, double-click **`START-EVENT-FRESH.bat`**.
- [ ] It warns you it will erase previous plays (your test rounds) — press any key to confirm.
- [ ] A black window opens and stays open. **Leave it open the entire event.**

That's it — the game is live and the prize clock is running 6–10 PM.

---

## 5. During the event

- **Attendees:** join `SnapPro-Game` Wi-Fi → scan QR → play → show their **claim code** at the booth.
- **Redeem a prize:** on the laptop, open the **admin dashboard**
  → http://localhost:3000/admin?key=snappro-admin
  → type/scan the attendee's code → mark redeemed → hand them the prize.
- The dashboard shows **live totals**: how many played, Alexas remaining, prizes redeemed.
- **If the black window ever closes / laptop restarts:** double-click **`START-GAME.bat`** (NOT the FRESH one). This restarts the server and **keeps all leads and the prize schedule intact.**

> ⚠️ **Never run `START-EVENT-FRESH.bat` again during the event** — it wipes all captured leads. Only `START-GAME.bat` for mid-event restarts.

---

## 6. 🏁 After the event — DO THIS BEFORE CLOSING

**Export your leads first — don't just close the laptop.**

- [ ] On the laptop, open (or click) this link to download the CSV of every lead:
  **http://localhost:3000/api/admin/export?key=snappro-admin**
- [ ] Confirm the file downloaded (name/email/phone/zip/interest/role/consent/score/prize/code/redeemed).
- [ ] Email it to yourself / save it to the cloud.
- [ ] Now you can close the server window.

---

## Quick troubleshooting

| Problem | Fix |
|---|---|
| "Site can't be reached" on the laptop | The server window closed. Double-click **`START-GAME.bat`**. |
| QR opens game on laptop but not phones | The QR points at `localhost`. Regenerate it at **/qr** using the `192.168.x.x` address from `ipconfig`. |
| Phone can't load the game | Phone isn't on the **`SnapPro-Game`** Wi-Fi, or laptop's IP changed — re-check `ipconfig` and update the QR. |
| Port stuck / weird errors | Close the window, double-click **`START-GAME.bat`** again (it clears stuck servers automatically). |
| Need to wipe and restart clean | Only before doors open: **`START-EVENT-FRESH.bat`**. |

---

## Key info

- **Admin dashboard:** http://localhost:3000/admin?key=snappro-admin
- **CSV export:** http://localhost:3000/api/admin/export?key=snappro-admin
- **Offline QR maker:** http://localhost:3000/qr
- **Reframe prize photos / logo size:** http://localhost:3000/curator?key=snappro-admin
- **Prizes:** 7× Amazon Alexa (paced) · Meyer Sound Surprise Pack · Unilumin Golf Umbrella · Unilumin Backpack · Unilumin notebooks/pens · $100 off a SnapPro consultation (everyone wins)
- **Event length** is set to 240 min (6–10 PM) in `config.json`. If the hours change, edit `durationMin` there before the fresh start.
</content>
