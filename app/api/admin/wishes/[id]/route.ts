import { NextResponse } from "next/server";
import { verifyAdmin, createAdminClient } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { hidden } = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wishes")
    .update({ hidden: !!hidden })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
