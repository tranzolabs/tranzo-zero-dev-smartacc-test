import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseEther } from "viem";

const DB_PATH = path.join(process.cwd(), "cards-db.json");

// A unified corporate treasury address where merchant payments are sent
const TREASURY_ADDR = "0x033D986709c6c794C42a1259A8baeb6693de9444" as `0x${string}`;

const LOGS_PATH = path.join(process.cwd(), "webhook_logs.json");

function getDB() {
  if (!fs.existsSync(DB_PATH)) return { cards: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function logWebhook(payload: any) {
  try {
    let logs = [];
    if (fs.existsSync(LOGS_PATH)) {
      logs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf-8"));
    }
    // Add to top, keep only last 50
    logs.unshift({ ts: Date.now(), ...payload });
    if (logs.length > 50) logs.length = 50;
    fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));
  } catch (e) {}
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("🔔 Lithic Webhook Received:", payload.type || payload.event_type);
    
    // Log for Developer UI
    logWebhook(payload);

    // 1. We only care about ASA Authorization events
    if (payload.type === "auth_stream.authorize") {
      const { card_token, amount, merchant } = payload.data;

      // 2. Fetch the user's Smart Wallet info from DB
      const db = getDB();
      const card = db.cards.find((c: any) => c.token === card_token);

      if (!card || !card.smartAddress || !card.sessionKeyPK) {
        console.error("❌ Card not found in DB or missing session key:", card_token);
        // Decline if we don't control this card's crypto wallet
        return NextResponse.json({ decision: "DECLINED" });
      }

      console.log(`✅ Found Wallet ${card.smartAddress} for Card ending in ${card.cardNumber?.slice(-4)}`);

      // 3. Convert USD Cents to ETH (Demo rate: $2800 = 1 ETH)
      const ethAmountStr = (amount / 100 / 2800).toFixed(6);
      console.log(`🔄 Attempting to deduct ${ethAmountStr} ETH for ${amount} cents purchase at ${merchant?.descriptor || "Merchant"}`);

      try {
        // 4. Autonomous On-Chain Settlement via ZeroDev Session Key
        const { sendCardPayment } = await import("@/lib/wallet");
        
        const { userOpHash } = await sendCardPayment(
          card.smartAddress as `0x${string}`,
          card.sessionKeyPK,
          TREASURY_ADDR,
          parseEther(ethAmountStr),
          card.spendLimit || "1.0"
        );

        console.log(`🎉 On-Chain Settlement Success! UserOp: ${userOpHash}`);
        
        // Save the transaction hash internally so the frontend can see it
        // In a real app, this goes to a real database. We use a temp file/event for the demo.
        const txEvent = {
          merchant: merchant?.descriptor || "Merchant",
          amount: ethAmountStr,
          from: card.smartAddress,
          to: TREASURY_ADDR,
          hash: userOpHash,
          ts: Date.now()
        };
        fs.writeFileSync(path.join(process.cwd(), "latest_tx.json"), JSON.stringify(txEvent));

        // 5. Approve the Lithic Transaction
        // Lithic ASA requires a 200 OK with this schema for approval
        return NextResponse.json({ approval_result: "APPROVED" });

      } catch (err: any) {
        console.error("❌ On-Chain Settlement Failed:", err.message);
        // Decline the Visa/Mastercard transaction if the user didn't have enough ETH
        return NextResponse.json({ approval_result: "DECLINED" });
      }
    }

    // 6. Handle ASYNCHRONOUS Events API (transaction.cleared, etc.)
    // These do not require authorization, just acknowledgement (HTTP 200)
    if (payload.event_type) {
      console.log(`📥 Async Event Received: ${payload.event_type}`);
      
      switch (payload.event_type) {
        case "transaction.cleared":
          console.log(`✅ Transaction ${payload.payload?.token} cleared for ${payload.payload?.amount} cents!`);
          break;
        case "card.created":
          console.log(`💳 New Card Created: ${payload.payload?.token}`);
          break;
        case "dispute.updated":
          console.log(`⚖️ Dispute Updated: ${payload.payload?.token}`);
          break;
        default:
          console.log(`ℹ️ Unhandled Lithic Event: ${payload.event_type}`);
      }

      // Return 200 OK so Lithic knows we successfully received the event
      return NextResponse.json({ success: true, acknowledged: true });
    }

    // Default response for other webhook types
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
