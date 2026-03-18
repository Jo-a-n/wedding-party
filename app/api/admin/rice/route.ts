import { NextResponse } from "next/server";
import { verifyAdmin, createAdminClient } from "@/lib/admin";

export async function DELETE(req: Request) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("rice_tosses")
    .delete()
    .neq("id", 0);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
