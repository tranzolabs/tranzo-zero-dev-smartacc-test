import { NextResponse } from "next/server";

import Lithic from 'lithic';

const lithic = new Lithic({
  apiKey: process.env.LITHIC_API_KEY || 'dummy_key',
  environment: 'sandbox',
});

export async function POST(req: Request) {
  try {
    const { token, otp } = await req.json();
    if (!token || !otp) return NextResponse.json({ error: "Missing token or otp" }, { status: 400 });

    // In a real production app, Lithic's network sends an SMS to the cardholder's registered phone number.
    // Since we are using the Sandbox environment, no real SMS is sent. We simulate the user entering the OTP.
    
    // Sandbox specific validation (our demo UI suggests 123456)
    if (otp !== "123456") {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 401 });
    }

    // Submit the OTP back to Lithic to complete the 3DS flow on their network
    await lithic.threeDS.authentication.simulateOtpEntry({
      token: token,
      otp: otp
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("3DS OTP Verify Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
