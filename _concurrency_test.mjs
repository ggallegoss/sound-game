// Concurrency / integrity stress test against the running game server.
// Fires N plays simultaneously (after the golden tickets are all due) so they
// all race for the limited prizes at once — the worst case. Then asserts no
// prize was ever over-awarded and every player got exactly one prize.
//
// Usage: node _concurrency_test.mjs [N]   (server must be running on :3000)

const N = Number(process.argv[2] || 120);
const BASE = "http://localhost:3000";

const play = (i) =>
  fetch(`${BASE}/api/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `User ${i}`,
      email: `race${i}@test.com`,
      interest: "Home theater",
      role: "Homeowner",
      consent: true,
      answers: [1, 0, 0, 2, 1],
    }),
  }).then((r) => r.json());

const main = async () => {
  // fire ALL at once — maximum contention
  const results = await Promise.all(Array.from({ length: N }, (_, i) => play(i)));

  // tally what players received
  const got = {};
  let errors = 0,
    noPrize = 0;
  const codes = new Set();
  for (const r of results) {
    if (r.error) { errors++; continue; }
    if (!r.prizeName) { noPrize++; continue; }
    got[r.prizeName] = (got[r.prizeName] || 0) + 1;
    codes.add(r.code);
  }

  // server's own ledger
  const stats = await fetch(`${BASE}/api/admin/stats?key=snappro-admin`).then((r) => r.json());

  console.log(`\n=== ${N} simultaneous plays ===`);
  console.log("players who received each prize:");
  for (const [k, v] of Object.entries(got)) console.log(`   ${v.toString().padStart(3)}  ${k}`);
  console.log(`\nunique claim codes: ${codes.size}  (should equal players who won)`);
  console.log(`errors: ${errors}   no-prize: ${noPrize}`);

  console.log("\nserver ledger (awarded / total):");
  let pass = true;
  for (const p of stats.prizes) {
    const playersGot = got[p.name] || 0;
    const overCap = p.tier !== "base" && p.awarded > p.total;
    const mismatch = playersGot !== p.awarded;
    if (overCap || mismatch) pass = false;
    console.log(
      `   ${p.tier.padEnd(5)} ${p.name.padEnd(26)} awarded=${p.awarded}` +
        (p.tier !== "base" ? `/${p.total}` : "") +
        `  players=${playersGot}` +
        (overCap ? "  ❌ OVER CAP" : "") +
        (mismatch ? "  ❌ LEDGER≠PLAYERS" : ""),
    );
  }

  const grand = stats.prizes.filter((p) => p.tier === "grand");
  const grandAwarded = grand.reduce((n, p) => n + p.awarded, 0);
  const grandOver = grand.some((p) => p.awarded > p.total);
  const wins = Object.values(got).reduce((a, b) => a + b, 0);

  console.log("\n=== ASSERTIONS ===");
  const checks = [
    [`every play got a prize (${wins}/${N})`, wins === N && noPrize === 0 && errors === 0],
    [`no grand prize over-awarded`, !grandOver],
    [`grand awarded ≤ 3`, grandAwarded <= 3],
    [`unique codes == winners`, codes.size === wins],
    [`server ledger matches players`, pass],
  ];
  for (const [label, ok] of checks) console.log(`   ${ok ? "✅" : "❌"} ${label}`);
  console.log(checks.every((c) => c[1]) ? "\n🟢 ALL PASSED — concurrency-safe\n" : "\n🔴 FAILED\n");
};
main();
