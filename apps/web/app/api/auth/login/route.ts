import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@xeno/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, email, password } = body;

    if (!role || !email) {
      return NextResponse.json(
        { success: false, error: "Missing email or role" },
        { status: 400 }
      );
    }

    if (role === "admin") {
      if (email === "admin@lume.in" && password === "admin123") {
        const sessionData = { role: "admin", email: "admin@lume.in", name: "Admin Manager" };
        const cookieStore = await cookies();
        cookieStore.set("session", JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        });

        return NextResponse.json({ success: true, user: sessionData });
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid admin credentials" },
          { status: 401 }
        );
      }
    }

    if (role === "customer") {
      const db = getDb();
      const res = await db.query("SELECT * FROM customers WHERE email = $1 LIMIT 1", [email.toLowerCase().trim()]);
      
      if (res.rows && res.rows.length > 0) {
        const customer = res.rows[0];
        const sessionData = { role: "customer", email: customer.email, name: customer.name, customerId: customer.id };
        const cookieStore = await cookies();
        cookieStore.set("session", JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        });

        return NextResponse.json({ success: true, user: sessionData });
      } else {
        return NextResponse.json(
          { success: false, error: "Customer email not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid role" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Auth Login API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
