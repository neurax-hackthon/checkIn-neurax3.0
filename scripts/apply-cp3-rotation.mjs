/**
 * apply-cp3-rotation.mjs
 * 
 * Run this script BEFORE switching to Final Evaluation (CP3).
 * It reads the saved CP3 plan from cp3-rotation.json and applies
 * it to jury_team_assignments so each faculty evaluates the
 * third set of unique teams.
 */
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const eqIdx = line.indexOf("=");
  if (eqIdx > 0) env[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
});

const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

async function del(juryId) {
  const r = await fetch(`${BASE}/rest/v1/jury_team_assignments?jury_id=eq.${juryId}`, {
    method: "DELETE",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  return { status: r.status, body: await r.text() };
}

async function insert(rows) {
  const r = await fetch(`${BASE}/rest/v1/jury_team_assignments`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  return { status: r.status, body: await r.text() };
}

async function run() {
  if (!fs.existsSync("scripts/cp3-rotation.json")) {
    console.error("❌ cp3-rotation.json not found. Run apply-rotation.mjs first.");
    process.exit(1);
  }

  const plan = JSON.parse(fs.readFileSync("scripts/cp3-rotation.json", "utf8"));

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Applying CP3 (Final Eval) Rotation to jury_team_assignments");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const item of plan) {
    // Delete current assignments
    const delRes = await del(item.jury_id);
    if (delRes.status >= 400) {
      console.error(`✗ DELETE failed for ${item.jury_name}:`, delRes.body);
      process.exit(1);
    }

    // Insert CP3 assignments
    if (item.team_ids.length > 0) {
      const rows = item.team_ids.map((tid) => ({ jury_id: item.jury_id, team_id: tid }));
      const insRes = await insert(rows);
      if (insRes.status >= 400) {
        console.error(`✗ INSERT failed for ${item.jury_name}:`, insRes.body);
        process.exit(1);
      }
    }

    console.log(`✓ ${item.jury_name.padEnd(22)} → ${item.team_ids.length} teams reassigned`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  CP3 rotation COMPLETE. Now switch checkpoint to Final Eval");
  console.log("  from the admin dashboard.");
  console.log("═══════════════════════════════════════════════════════════\n");
}

run().catch(console.error);
