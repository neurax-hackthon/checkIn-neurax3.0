import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { validateImportRows } from "@/lib/imports/validate";

const bodySchema = z.object({
  rows: z.array(z.record(z.string(), z.string())),
  mapping: z.record(z.string(), z.string()),
  mode: z.enum(["add", "update"]),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = await validateImportRows(parsed.data.rows, parsed.data.mapping, parsed.data.mode);
  return NextResponse.json({ ok: true, result });
}
