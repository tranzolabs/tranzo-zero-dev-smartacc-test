import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "cards-db.json");

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ cards: [] }));
  }
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

function saveDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Store a newly activated card
export async function POST(req: Request) {
  try {
    const { cardNumber, cvv, smartAddress, sessionKeyPK, spendLimit } = await req.json();

    if (!cardNumber || !cvv || !smartAddress || !sessionKeyPK) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDB();
    
    // Remove if already exists, then push updated
    db.cards = db.cards.filter((c: any) => c.smartAddress !== smartAddress);
    
    db.cards.push({
      cardNumber,
      cvv,
      smartAddress,
      sessionKeyPK,
      spendLimit
    });

    saveDB(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Retrieve card setup details via Card Number & CVV for auth verification
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cardNumber = searchParams.get("cardNumber");
    const cvv = searchParams.get("cvv");

    if (!cardNumber || !cvv) {
      return NextResponse.json({ error: "Missing cardNumber or cvv query" }, { status: 400 });
    }

    const db = getDB();
    const card = db.cards.find((c: any) => c.cardNumber === cardNumber && c.cvv === cvv);

    if (!card) {
      return NextResponse.json({ error: "Card not found or invalid CVV" }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
