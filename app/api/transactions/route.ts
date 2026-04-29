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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const smartAddress = searchParams.get("smartAddress");

    if (!smartAddress) {
      return NextResponse.json({ error: "Missing smartAddress" }, { status: 400 });
    }

    if (!process.env.LITHIC_API_KEY) {
      return NextResponse.json({ transactions: [] });
    }

    const db = getDB();
    const card = db.cards.find((c: any) => c.smartAddress?.toLowerCase() === smartAddress.toLowerCase());

    if (!card || !card.token) {
      return NextResponse.json({ transactions: [] });
    }

    // List transactions from Lithic API
    const txs = await lithic.transactions.list();
    
    // Filter for this specific card
    const cardTxs = txs.data.filter(tx => tx.card_token === card.token);

    // Map to the frontend's TxRecord format
    const mapped = cardTxs.map(tx => {
      // Convert Lithic cents back to ETH (assuming $2800 = 1 ETH)
      const ethAmount = Math.abs(tx.amount / 100 / 2800).toFixed(4);
      return {
        hash: tx.token,
        type: tx.amount > 0 ? "send" : "receive", 
        amount: ethAmount,
        to: tx.merchant?.acceptor_id || "Unknown",
        time: new Date(tx.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: tx.status.toLowerCase(),
        merchant: tx.merchant?.descriptor || "Merchant"
      };
    });

    return NextResponse.json({ transactions: mapped });
  } catch (err: any) {
    console.error("Lithic Tx Fetch Error:", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
