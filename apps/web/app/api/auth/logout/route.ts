import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Auth Logout API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
