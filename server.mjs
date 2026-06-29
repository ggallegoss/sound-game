// SnapPro "Sound in Film" lead-capture game — zero-dependency Node server.
//
// Server-AUTHORITATIVE prize engine: the browser only animates a result the
// server already decided. Big/limited prizes use the "golden ticket" method —
// each unit is pre-scheduled at a random moment inside its own time bucket, so
// they spread across the whole event and can never be drained early. Everyone
// always wins at least a base prize. All writes run under an in-process lock,
// so concurrent plays can't double-award the last item.
//
// Run:   node server.mjs           (http://localhost:3000)
// Admin: http://localhost:3000/admin?key=snappro-admin

import http from "node:http";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA_DIR = join(__dirname, "data");
const STATE_FILE = join(DATA_DIR, "state.json");
const CONFIG_FILE = join(__dirname, "config.json");
const PUBLIC_DIR = join(__dirname, "public");

const cfg = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// State + golden-ticket seeding
// ---------------------------------------------------------------------------
const isLimited = (p) => p.tier === "grand" || p.tier === "mid";

function seed() {
  const now = Date.now();
  const minutes =
    cfg.event.demoCompressMin > 0
      ? cfg.event.demoCompressMin
      : cfg.event.durationMin;
  const durationMs = minutes * 60_000;

  const tickets = [];
  for (const p of cfg.prizes.filter(isLimited)) {
    for (let k = 0; k < p.total; k++) {
      const a = now + (durationMs * k) / p.total;
      const b = now + (durationMs * (k + 1)) / p.total;
      tickets.push({ prizeId: p.id, time: a + Math.random() * (b - a), used: false });
    }
  }
  tickets.sort((x, y) => x.time - y.time);

  return {
    seededAt: now,
    durationMs,
    prizes: cfg.prizes.map((p) => ({ ...p, remaining: p.total, awarded: 0 })),
    tickets,
    leads: [],
  };
}

let state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
  : seed();
save();

function save() {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}
const prizeById = (id) => state.prizes.find((p) => p.id === id);

// ---------------------------------------------------------------------------
// Curator framing: per-image pan/zoom + logo size (edited in /curator)
// ---------------------------------------------------------------------------
const FRAMING_FILE = join(DATA_DIR, "framing.json");
let framing = existsSync(FRAMING_FILE)
  ? JSON.parse(readFileSync(FRAMING_FILE, "utf8"))
  : { images: {}, logo: { size: 50 } };
function saveFraming() {
  writeFileSync(FRAMING_FILE, JSON.stringify(framing, null, 2));
}

// ---------------------------------------------------------------------------
// Prize award — runs under the lock
// ---------------------------------------------------------------------------
function awardPrize(now) {
  // Claim the earliest due, unused golden ticket whose prize still has stock.
  for (const tk of state.tickets) {
    if (tk.used) continue;
    if (tk.time > now) break; // sorted: nothing earlier is due
    const p = prizeById(tk.prizeId);
    if (p && p.remaining > 0) {
      tk.used = true;
      p.remaining -= 1;
      p.awarded += 1;
      return p;
    }
    tk.used = true; // stale ticket (shouldn't happen) — discard
  }
  // Otherwise: weighted-random base prize (always available).
  const base = state.prizes.filter((p) => p.tier === "base" && p.remaining > 0);
  const pool = [];
  for (const p of base) for (let i = 0; i < (p.weight || 1); i++) pool.push(p);
  const chosen = pool[Math.floor(Math.random() * pool.length)] || base[0];
  if (chosen) {
    chosen.awarded += 1;
    if (chosen.remaining < 100000) chosen.remaining -= 1;
  }
  return chosen;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = "SP-" + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (state.leads.some((l) => l.code === code));
  return code;
}

// ---------------------------------------------------------------------------
// In-process lock so awards never race
// ---------------------------------------------------------------------------
let chain = Promise.resolve();
function withLock(fn) {
  const run = chain.then(() => fn());
  chain = run.then(
    () => {},
    () => {},
  );
  return run;
}

function computeScore(answers) {
  if (!Array.isArray(answers)) return 0;
  let s = 0;
  cfg.quiz.forEach((q, i) => {
    if (answers[i] === q.answer) s += 1;
  });
  return s;
}

async function play(body) {
  return withLock(() => {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return { error: "A valid email is required." };

    const existing = state.leads.find((l) => l.email === email);
    if (existing) return { ...publicLead(existing), alreadyPlayed: true };

    const score = computeScore(body.answers);
    const prize = awardPrize(Date.now());
    const lead = {
      id: randomUUID(),
      name: String(body.name || "").trim(),
      email,
      phone: String(body.phone || "").trim(),
      zip: String(body.zip || "").trim(),
      interest: String(body.interest || "").trim(),
      role: String(body.role || "").trim(),
      consent: !!body.consent,
      score,
      quizTotal: cfg.quiz.length,
      prizeId: prize.id,
      prizeName: prize.name,
      prizeIcon: prize.icon,
      prizeTier: prize.tier,
      code: genCode(),
      redeemed: false,
      playedAt: Date.now(),
    };
    state.leads.push(lead);
    save();
    return { ...publicLead(lead), alreadyPlayed: false };
  });
}

const publicLead = (l) => ({
  prizeName: l.prizeName,
  prizeIcon: l.prizeIcon,
  prizeTier: l.prizeTier,
  code: l.code,
  score: l.score,
  quizTotal: l.quizTotal,
  redeemed: l.redeemed,
});

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".json": "application/json",
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(body);
}
function sendFile(res, path) {
  if (!existsSync(path)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": MIME[extname(path)] || "application/octet-stream" });
  res.end(readFileSync(path));
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}
const auth = (url) => url.searchParams.get("key") === cfg.adminKey;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Public config (quiz WITHOUT answers, branding)
  if (path === "/api/config" && req.method === "GET") {
    return sendJSON(res, 200, {
      brand: cfg.brand,
      // answer is included so the UI can show right/wrong feedback — harmless,
      // since the score does NOT affect prizes (everyone wins on inventory).
      quiz: cfg.quiz.map((q) => ({ q: q.q, options: q.options, image: q.image || null, answer: q.answer })),
      // showcase (no counts) so the splash can tease what's up for grabs
      showcase: cfg.prizes.map((p) => ({
        name: p.name,
        tier: p.tier,
        icon: p.icon,
        image: p.image || null,
      })),
    });
  }

  // Framing (public read so the game applies it)
  if (path === "/api/framing" && req.method === "GET") {
    return sendJSON(res, 200, framing);
  }
  // Framing save (curator)
  if (path === "/api/admin/framing" && req.method === "POST") {
    if (!auth(url)) return sendJSON(res, 403, { error: "bad key" });
    const body = await readBody(req);
    if (body && typeof body === "object") {
      framing = { images: body.images || {}, logo: body.logo || { size: 50 } };
      saveFraming();
      return sendJSON(res, 200, { ok: true });
    }
    return sendJSON(res, 400, { error: "bad body" });
  }

  // Play
  if (path === "/api/play" && req.method === "POST") {
    const body = await readBody(req);
    const result = await play(body);
    return sendJSON(res, result.error ? 400 : 200, result);
  }

  // Admin: live stats
  if (path === "/api/admin/stats" && req.method === "GET") {
    if (!auth(url)) return sendJSON(res, 403, { error: "bad key" });
    const byInterest = {};
    const byRole = {};
    for (const l of state.leads) {
      byInterest[l.interest || "—"] = (byInterest[l.interest || "—"] || 0) + 1;
      byRole[l.role || "—"] = (byRole[l.role || "—"] || 0) + 1;
    }
    return sendJSON(res, 200, {
      seededAt: state.seededAt,
      durationMs: state.durationMs,
      totalLeads: state.leads.length,
      redeemed: state.leads.filter((l) => l.redeemed).length,
      prizes: state.prizes.map((p) => ({
        name: p.name,
        tier: p.tier,
        total: p.total,
        remaining: p.remaining,
        awarded: p.awarded || 0,
        icon: p.icon,
      })),
      byInterest,
      byRole,
      recent: state.leads
        .slice(-25)
        .reverse()
        .map((l) => ({
          name: l.name,
          email: l.email,
          interest: l.interest,
          role: l.role,
          prizeName: l.prizeName,
          prizeTier: l.prizeTier,
          code: l.code,
          redeemed: l.redeemed,
          playedAt: l.playedAt,
        })),
    });
  }

  // Admin: redeem a code
  if (path === "/api/admin/redeem" && req.method === "POST") {
    if (!auth(url)) return sendJSON(res, 403, { error: "bad key" });
    const body = await readBody(req);
    const code = String(body.code || "").trim().toUpperCase();
    return withLock(() => {
      const lead = state.leads.find((l) => l.code === code);
      if (!lead) return sendJSON(res, 404, { error: "Code not found" });
      const already = lead.redeemed;
      lead.redeemed = true;
      save();
      return sendJSON(res, 200, {
        ok: true,
        already,
        name: lead.name,
        prizeName: lead.prizeName,
        prizeTier: lead.prizeTier,
      });
    });
  }

  // Admin: CSV export
  if (path === "/api/admin/export" && req.method === "GET") {
    if (!auth(url)) return sendJSON(res, 403, { error: "bad key" });
    const cols = ["playedAt", "name", "email", "phone", "zip", "interest", "role", "consent", "score", "prizeName", "prizeTier", "code", "redeemed"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [cols.join(",")];
    for (const l of state.leads) {
      rows.push(cols.map((c) => esc(c === "playedAt" ? new Date(l.playedAt).toISOString() : l[c])).join(","));
    }
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="snappro-leads.csv"',
    });
    return res.end(rows.join("\n"));
  }

  // Static
  if (path === "/" || path === "") return sendFile(res, join(PUBLIC_DIR, "index.html"));
  if (path === "/admin") return sendFile(res, join(PUBLIC_DIR, "admin.html"));
  if (path === "/curator") return sendFile(res, join(PUBLIC_DIR, "curator.html"));
  const safe = join(PUBLIC_DIR, path.replace(/\.\./g, ""));
  if (safe.startsWith(PUBLIC_DIR)) return sendFile(res, safe);
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  const limited = cfg.prizes.filter(isLimited).reduce((n, p) => n + p.total, 0);
  console.log(`\n  SnapPro Sound-in-Film game running:`);
  console.log(`    Player : http://localhost:${PORT}/`);
  console.log(`    Admin  : http://localhost:${PORT}/admin?key=${cfg.adminKey}`);
  console.log(`    ${state.leads.length} leads so far · ${limited} limited prizes scheduled over ${Math.round(state.durationMs / 60000)} min\n`);
});
