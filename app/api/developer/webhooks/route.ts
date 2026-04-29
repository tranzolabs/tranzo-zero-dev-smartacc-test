import { NextResponse } from "next/server";
import Lithic from "lithic";

const lithic = new Lithic({
  apiKey: process.env.LITHIC_API_KEY || 'dummy_key',
  environment: 'sandbox',
});

// Fetch all active event subscriptions
export async function GET() {
  try {
    if (!process.env.LITHIC_API_KEY) {
      throw new Error("LITHIC_API_KEY is not set in .env.local");
    }

    const subscriptions = [];
    for await (const sub of lithic.events.subscriptions.list()) {
      subscriptions.push(sub);
    }

    return NextResponse.json({ success: true, subscriptions });
  } catch (err: any) {
    console.error("Lithic Subscriptions Error:", err);
    return NextResponse.json({ error: "Failed to fetch subscriptions: " + err.message }, { status: 500 });
  }
}

// Create a new event subscription
export async function POST(req: Request) {
  try {
    const { url, description } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing webhook URL" }, { status: 400 });
    }

    if (!process.env.LITHIC_API_KEY) {
      throw new Error("LITHIC_API_KEY is not set in .env.local");
    }

    const subscription = await lithic.events.subscriptions.create({
      url,
      description: description || "Tranzo Event Subscription"
    });

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    console.error("Lithic Subscriptions Error:", err);
    return NextResponse.json({ error: "Failed to create subscription: " + err.message }, { status: 500 });
  }
}

// Delete an event subscription
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing subscription token" }, { status: 400 });
    }

    if (!process.env.LITHIC_API_KEY) {
      throw new Error("LITHIC_API_KEY is not set in .env.local");
    }

    await lithic.events.subscriptions.del(token);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lithic Subscriptions Error:", err);
    return NextResponse.json({ error: "Failed to delete subscription: " + err.message }, { status: 500 });
  }
}
