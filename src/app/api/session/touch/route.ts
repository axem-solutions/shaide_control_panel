import { NextResponse } from "next/server";
import {
  refreshSessionCookies,
  requireAuthSession,
  shouldRefreshSessionFromTouch,
} from "../../_utils";

export async function POST(request: Request) {
  const session = await requireAuthSession();
  if (!session.ok) {
    return session.response;
  }

  if (!(await shouldRefreshSessionFromTouch())) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return refreshSessionCookies(NextResponse.json({ ok: true }, { status: 200 }), session, request);
}
