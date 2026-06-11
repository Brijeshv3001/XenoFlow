import { NextRequest, NextResponse } from "next/server";
import { deleteSegment } from "@xeno/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSegment(id);
    return NextResponse.json({ success: true, ok: true });
  } catch (err: any) {
    console.error("Delete Segment error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
