/**
 * apply-rotation.mjs
 * 
 * Applies CP2 team rotation to jury_team_assignments.
 * Also saves CP3 rotation plan to scripts/cp3-rotation.json for later use.
 * 
 * Rotation rule per domain (3 faculty, 3 blocks):
 *   CP2: F0 ← F1's CP1 teams, F1 ← F2's CP1 teams, F2 ← F0's CP1 teams
 *   CP3: F0 ← F2's CP1 teams, F1 ← F0's CP1 teams, F2 ← F1's CP1 teams
 *        (i.e. rotate CP2 assignments one more time)
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

async function get(path) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  return r.json();
}

async function del(path, body) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    method: "DELETE",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.text() };
}

async function post(path, body) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.text() };
}

// ─── Domain groups ─────────────────────────────────────────────────────────
const DOMAINS = {
  Cyber: [
    { name: "S. Kiran",         id: "223c942c-a4be-48e7-a247-2bb897b0b271" },
    { name: "K. Madhu",         id: "9d2d9486-0d68-482e-ab67-661db26772dc" },
    { name: "I. Kranthi Kumar", id: "84068b11-bc46-4ba5-a9e4-0327334b4760" },
  ],
  Industry: [
    { name: "Ch. Gopi Krishna", id: "be63213d-9c1d-4c8b-8e6d-c1dd275f6f8a" },
    { name: "P. Vishnu",        id: "f5e8c85c-0e93-4899-ac1a-e01d9cececd5" },
    { name: "B. Ravinder Naik", id: "3db7a7a2-6a0b-41d1-a8ce-2cc765b46217" },
  ],
  "Smart Cities": [
    { name: "B. Prashanth",    id: "c71a63a8-becc-4e2b-a281-88ac7d00a98e" },
    { name: "G. Pavan",        id: "2b12b697-e154-439a-a5ec-af6700cc48c3" },
    { name: "V. Kiran Kumar",  id: "912957cb-67bd-461a-9b0c-5f1d92771871" },
  ],
};

async function run() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Applying CP2 Rotation to jury_team_assignments");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Fetch current assignments
  const assignments = await get("jury_team_assignments?select=jury_id,team_id");
  if (!Array.isArray(assignments)) {
    console.error("Failed to fetch assignments:", assignments);
    process.exit(1);
  }

  // Group by jury_id
  const assignMap = new Map();
  for (const a of assignments) {
    const list = assignMap.get(a.jury_id) ?? [];
    list.push(a.team_id);
    assignMap.set(a.jury_id, list);
  }

  // Build CP2 and CP3 rotation plans
  const cp3Plan = []; // Save for later

  for (const [domain, faculty] of Object.entries(DOMAINS)) {
    console.log(`\n── ${domain} ────────────────────────────`);

    // CP1 blocks (current state)
    const blocks = faculty.map((f) => ({
      faculty: f,
      teamIds: assignMap.get(f.id) ?? [],
    }));

    // CP2: F[i] gets F[(i+1)%3]'s teams
    const cp2 = blocks.map((b, i) => ({
      faculty: b.faculty,
      teamIds: blocks[(i + 1) % 3].teamIds,
    }));

    // CP3: F[i] gets F[(i+2)%3]'s teams (rotate one more)
    const cp3 = blocks.map((b, i) => ({
      faculty: b.faculty,
      teamIds: blocks[(i + 2) % 3].teamIds,
    }));

    // Save CP3 plan
    for (const item of cp3) {
      cp3Plan.push({ jury_id: item.faculty.id, jury_name: item.faculty.name, team_ids: item.teamIds });
    }

    // Show plan
    console.log("  CP1 (current):  " + blocks.map((b) => `${b.faculty.name}(${b.teamIds.length})`).join(" | "));
    console.log("  CP2 (applying): " + cp2.map((b) => `${b.faculty.name}(${b.teamIds.length})`).join(" | "));
    console.log("  CP3 (saved):    " + cp3.map((b) => `${b.faculty.name}(${b.teamIds.length})`).join(" | "));

    // ── Apply CP2: delete then insert ───────────────────────────────────────
    for (const item of cp2) {
      const juryId = item.faculty.id;

      // Delete all current assignments for this faculty member
      const delRes = await del(`jury_team_assignments?jury_id=eq.${juryId}`, null);
      if (delRes.status >= 400) {
        console.error(`  ✗ DELETE failed for ${item.faculty.name}:`, delRes.body);
        process.exit(1);
      }

      // Insert new rotated assignments
      if (item.teamIds.length > 0) {
        const rows = item.teamIds.map((tid) => ({ jury_id: juryId, team_id: tid }));
        const insRes = await post("jury_team_assignments", rows);
        if (insRes.status >= 400) {
          console.error(`  ✗ INSERT failed for ${item.faculty.name}:`, insRes.body);
          process.exit(1);
        }
      }

      console.log(`  ✓ ${item.faculty.name.padEnd(20)} → ${item.teamIds.length} teams reassigned`);
    }
  }

  // Save CP3 plan to JSON file
  fs.writeFileSync("scripts/cp3-rotation.json", JSON.stringify(cp3Plan, null, 2));
  console.log("\n✓ CP3 rotation plan saved to scripts/cp3-rotation.json");

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  CP2 rotation COMPLETE. Run apply-cp3-rotation.mjs");
  console.log("  when switching to Final Evaluation.");
  console.log("═══════════════════════════════════════════════════════════\n");
}

run().catch(console.error);
