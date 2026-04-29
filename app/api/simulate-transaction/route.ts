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
    return { cards: [] };
  }
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

export async function POST(req: Request) {
  try {
    const { cardNumber, amount } = await req.json();

    if (!cardNumber || !amount) {
      return NextResponse.json({ error: "Missing cardNumber or amount" }, { status: 400 });
    }

    if (!process.env.LITHIC_API_KEY) {
      throw new Error("LITHIC_API_KEY is not set in .env.local");
    }

    // Convert ETH amount to USD cents (assuming 1 ETH = $2800 for demo)
    const amountInCents = Math.floor(parseFloat(amount) * 2800 * 100);

    // Simulate an authorization on the Lithic Sandbox network
    const auth = await lithic.transactions.simulateAuthorization({
      amount: amountInCents,
      descriptor: "Tranzo Demo Merchant",
      pan: cardNumber
    });

    // Optionally clear it right away to simulate full settlement
    if (auth.token) {
      await lithic.transactions.simulateClearing({
        amount: amountInCents,
        token: auth.token
      }).catch(console.error); // don't fail if clearing fails
    }

    // --- LOCAL FALLBACK SETTLEMENT ---
    // If the user hasn't configured the ngrok webhook in Lithic's dashboard,
    // the webhook won't fire locally. We execute the settlement here manually as a fallback
    // so the local demo store continues to work!
    let userOpHash = "0x_fallback";
    try {
      const db = getDB();
      const card = db.cards.find((c: any) => c.cardNumber?.replace(/\s+/g, "") === cardNumber.replace(/\s+/g, ""));
      
      if (card && card.sessionKeyPK) {
        const { parseEther } = await import("viem");
        const { sendCardPayment } = await import("@/lib/wallet");
        
        const ethAmountStr = (amountInCents / 100 / 2800).toFixed(6);
        const TREASURY_ADDR = "0x033D986709c6c794C42a1259A8baeb6693de9444" as `0x${string}`;

        const result = await sendCardPayment(
          card.smartAddress as `0x${string}`,
          card.sessionKeyPK,
          TREASURY_ADDR,
          parseEther(ethAmountStr),
          card.spendLimit || "1.0"
        );
        userOpHash = result.userOpHash;

        // Record the transaction locally for TxHistory to pick up
        const txEvent = {
          merchant: "Tranzo Demo Merchant",
          amount: ethAmountStr,
          from: card.smartAddress,
          to: TREASURY_ADDR,
          hash: userOpHash,
          ts: Date.now()
        };
        fs.writeFileSync(path.join(process.cwd(), "latest_tx.json"), JSON.stringify(txEvent));
      }
    } catch (fallbackErr: any) {
      console.warn("Fallback local settlement failed:", fallbackErr.message);
    }

    return NextResponse.json({ success: true, auth, userOpHash });
  } catch (err: any) {
    console.error("Lithic Simulation Error:", err);
    return NextResponse.json({ error: "Lithic API Error: " + err.message }, { status: 500 });
  }
}
