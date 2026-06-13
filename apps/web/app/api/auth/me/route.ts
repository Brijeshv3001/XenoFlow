import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie) {
      return NextResponse.json({ success: true, user: null });
    }
    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: true, user: null });
  }
}
