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
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ cards: [] }));
  }
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

function saveDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Store a newly activated card via Lithic
export async function POST(req: Request) {
  try {
    const { smartAddress, sessionKeyPK, spendLimit } = await req.json();

    if (!smartAddress || !sessionKeyPK) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDB();
    
    const existingCardIndex = db.cards.findIndex((c: any) => c.smartAddress?.toLowerCase() === smartAddress.toLowerCase());
    const existingCard = existingCardIndex !== -1 ? db.cards[existingCardIndex] : null;

    let lithicCard;
    try {
      if (!process.env.LITHIC_API_KEY) {
        throw new Error("LITHIC_API_KEY is not set in .env.local");
      }
      
      // Convert ETH spend limit to USD cents (demo: 1 ETH = $2800)
      const limitInCents = Math.floor(parseFloat(spendLimit) * 2800 * 100);

      if (existingCard && existingCard.token) {
        console.log("Updating existing Lithic card:", existingCard.token, "to limit:", limitInCents);
        // Update existing card limit in Lithic
        lithicCard = await lithic.cards.update(existingCard.token, {
          spend_limit: limitInCents || 10000
        });

        // Update the database entry
        existingCard.spendLimit = spendLimit;
        existingCard.sessionKeyPK = sessionKeyPK;
        saveDB(db);

        console.log("Successfully updated existing card in DB.");
        return NextResponse.json({ success: true, card: existingCard });
      } else {
        console.log("No existing card found, creating new one.");
        // Create a virtual card in the Lithic Sandbox with spend limit
        lithicCard = await lithic.cards.create({
          type: 'VIRTUAL',
          memo: `Tranzo Smart Wallet`,
          spend_limit: limitInCents || 10000 // default $100
        });
      }
    } catch (err: any) {
      console.error("Lithic Error:", err);
      return NextResponse.json({ error: "Lithic API Error: " + err.message }, { status: 500 });
    }

    // New card flow
    db.cards = db.cards.filter((c: any) => c.smartAddress?.toLowerCase() !== smartAddress.toLowerCase());
    
    const newCard = {
      cardNumber: lithicCard.pan,
      cvv: lithicCard.cvv,
      token: lithicCard.token,
      smartAddress,
      sessionKeyPK,
      spendLimit
    };

    db.cards.push(newCard);
    saveDB(db);

    return NextResponse.json({ success: true, card: newCard });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Retrieve card details
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cardNumber = searchParams.get("cardNumber");
    const cvv = searchParams.get("cvv");
    const smartAddress = searchParams.get("smartAddress");

    const db = getDB();

    let card;
    if (smartAddress) {
      card = db.cards.find((c: any) => c.smartAddress?.toLowerCase() === smartAddress.toLowerCase());
    } else if (cardNumber && cvv) {
      const searchNum = cardNumber.replace(/\s+/g, "");
      card = db.cards.find((c: any) => c.cardNumber?.replace(/\s+/g, "") === searchNum && c.cvv === cvv.trim());
    }

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Fetch live state from Lithic
    let state = "OPEN";
    if (process.env.LITHIC_API_KEY && card.token) {
      try {
        const lithicCard = await lithic.cards.retrieve(card.token);
        state = lithicCard.state;
      } catch(e) {
        console.error("Lithic Retrieve Error:", e);
      }
    }

    return NextResponse.json({ card: { ...card, state } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
