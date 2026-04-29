import { NextResponse } from "next/server";
import Lithic from 'lithic';

const lithic = new Lithic({
  apiKey: process.env.LITHIC_API_KEY || 'dummy_key',
  environment: 'sandbox',
});

export async function POST(req: Request) {
  try {
    const { pan, amount } = await req.json();
    if (!pan) return NextResponse.json({ error: "Missing pan" }, { status: 400 });

    const amountInCents = amount ? Math.floor(parseFloat(amount) * 2800 * 100) : 1000;

    // Simulate 3DS Authentication challenge creation
    const res = await lithic.threeDS.authentication.simulate({
      pan: pan,
      merchant: {
        id: '174030075991',
        name: 'Tranzo Demo Merchant',
        country: 'USA',
        mcc: '5411'
      },
      transaction: {
        amount: amountInCents,
        currency: 'USD'
      }
    });
    
    return NextResponse.json({ success: true, token: res.token });
  } catch (err: any) {
    console.error("3DS Simulate Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
