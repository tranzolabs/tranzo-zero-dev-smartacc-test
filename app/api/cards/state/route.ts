import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Lithic from 'lithic';

const DB_PATH = path.join(process.cwd(), "cards-db.json");

const lithic = new Lithic({
  apiKey: process.env.LITHIC_API_KEY || 'dummy_key',
  environment: 'sandbox',
});

function getDB() {
  if (!fs.existsSync(DB_PATH)) return { cards: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

export async function PATCH(req: Request) {
  try {
    const { smartAddress, state } = await req.json();

    if (!smartAddress || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.LITHIC_API_KEY) {
      return NextResponse.json({ error: "LITHIC_API_KEY is not set" }, { status: 500 });
    }

    const db = getDB();
    const card = db.cards.find((c: any) => c.smartAddress === smartAddress);

    if (!card || !card.token) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Call Lithic to update the card state (PAUSED or OPEN)
    const updatedCard = await lithic.cards.update(card.token, { state });

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (err: any) {
    console.error("Lithic State Update Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
