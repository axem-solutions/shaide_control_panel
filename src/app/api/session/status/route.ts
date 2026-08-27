import { NextResponse } from "next/server";
import { requireAuthSession } from "../../_utils";

export async function GET() {
  const session = await requireAuthSession();
  if (!session.ok) {
    return session.response;
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
