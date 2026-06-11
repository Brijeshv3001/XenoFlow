import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { goal, channel, tone } = await req.json();
    if (!goal || !channel) {
      return NextResponse.json({ success: false, error: "goal and channel are required" }, { status: 400 });
    }

    const hasKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "mock-key";
    if (!hasKey) {
      // Mock copy variants fallback matching Lumé's premium theme
      const mockVariants = [
        {
          variant: 1,
          tone: tone || "friendly",
          subject: "Exclusive Lumé Arrivals Just For You",
          message: `Hey {{first_name}}, we noticed you love premium fashion. Check out our brand-new collection of Kurtas and Summer Dresses! Handcrafted with love in ${channel === 'whatsapp' ? '🇮🇳' : 'India'}. Get free shipping today.`
        },
        {
          variant: 2,
          tone: "exclusive",
          subject: "Shh... Your VIP Invitation inside",
          message: `Hello {{first_name}}, as a valued Lumé shopper, you're invited to shop our Private Sale before anyone else. Enjoy a special 15% VIP discount automatically applied at checkout.`
        },
        {
          variant: 3,
          tone: "urgent",
          subject: "Last Call: Lumé items are selling out!",
          message: `Hurry {{first_name}}! The outfits in your cart are in high demand and running low on stock. Place your order in the next 3 hours to secure your items and receive priority delivery!`
        }
      ];
      return NextResponse.json({ success: true, variants: mockVariants });
    }

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Generate 3 ${channel} message variants for Lumé fashion brand.
Goal: ${goal}
Tone: ${tone ?? "friendly"}
Channel constraints: ${channel === "sms" ? "max 160 chars" : channel === "whatsapp" ? "max 500 chars, can use emojis" : "no limit"}
Use {{first_name}} for personalization.
Return JSON array: [{ "variant": 1, "tone": "...", "message": "...", "subject": "..." }]
Only JSON, no markdown.`
      }],
    });

    const text = (response.content[0] as any).text.trim();
    const cleanText = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
    const variants = JSON.parse(cleanText);
    return NextResponse.json({ success: true, variants });
  } catch (err: any) {
    console.error("AI Message Variants error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
