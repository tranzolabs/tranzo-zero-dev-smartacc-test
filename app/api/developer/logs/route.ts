import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOGS_PATH = path.join(process.cwd(), "webhook_logs.json");

export async function GET() {
  try {
    if (!fs.existsSync(LOGS_PATH)) {
      return NextResponse.json({ logs: [] });
    }
    const logs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf-8"));
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
