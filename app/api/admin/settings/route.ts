import { NextResponse } from "next/server";
import { verifyAdmin, createAdminClient } from "@/lib/admin";

export async function GET(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = createAdminClient();

  for (const [key, value] of Object.entries(body)) {
    await supabase
      .from("site_settings")
      .upsert({ key, value: value as string, updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ success: true });
}
