import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function deriveQrToken(participantId, qrVersion) {
  const mac = createHmac("sha256", process.env.QR_SIGNING_SECRET)
    .update(`${participantId}:${qrVersion}`)
    .digest("hex");
  return `NX3:${mac}`;
}
function hashQrToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function main() {
  console.log("Seeding demo data...");

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .upsert({ room_code: "C-204", display_name: "Lab C-204", row_count: 4, column_count: 6 }, { onConflict: "room_code" })
    .select("id, row_count, column_count")
    .single();
  if (roomErr) throw roomErr;

  const benches = [];
  for (let r = 1; r <= room.row_count; r++) {
    for (let c = 1; c <= room.column_count; c++) {
      benches.push({
        room_id: room.id,
        row_number: r,
        column_number: c,
        label: `R${String(r).padStart(2, "0")}-C${String(c).padStart(2, "0")}`,
      });
    }
  }
  await supabase.from("benches").upsert(benches, { onConflict: "room_id,row_number,column_number" });

  const { data: bench } = await supabase
    .from("benches")
    .select("id")
    .eq("room_id", room.id)
    .eq("row_number", 3)
    .eq("column_number", 5)
    .single();

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .upsert(
      { team_code: "NX-042", team_name: "Neural Sparks", room_id: room.id, bench_id: bench.id },
      { onConflict: "team_code" }
    )
    .select("id")
    .single();
  if (teamErr) throw teamErr;

  const demoParticipants = [
    { name: "Aditi Rao", email: "aditi@example.com", is_team_leader: true },
    { name: "Rahul Das", email: "rahul@example.com", is_team_leader: false },
    { name: "Sana Iyer", email: "sana@example.com", is_team_leader: false },
  ];

  for (const p of demoParticipants) {
    const { data: existing } = await supabase.from("participants").select("id").eq("email", p.email).maybeSingle();
    if (existing) {
      console.log(`skip  ${p.email} (already exists)`);
      continue;
    }
    const { data: inserted, error } = await supabase
      .from("participants")
      .insert({
        name: p.name,
        email: p.email,
        team_id: team.id,
        is_team_leader: p.is_team_leader,
        qr_token_hash: `placeholder:${randomUUID()}`,
        qr_version: 1,
      })
      .select("id")
      .single();
    if (error) throw error;

    const token = deriveQrToken(inserted.id, 1);
    await supabase.from("participants").update({ qr_token_hash: hashQrToken(token) }).eq("id", inserted.id);
    console.log(`created ${p.email}`);
  }

  console.log("\nSeed complete.");
  console.log("Room: C-204, Team: NX-042, Bench: R03-C05");
  console.log("Participant logins: aditi@example.com / rahul@example.com / sana@example.com, password: neuraxcmrtc");
  console.log("Admin login: admin@neurax.dev / adminneurax");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
