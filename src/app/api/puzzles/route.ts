import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = new URL("https://chess-puzzles-api.vercel.app/puzzles");
    
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const response = await fetch(targetUrl.toString());
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Proxy fetch failed:", e);
    return NextResponse.json({ error: e.message || "Failed to fetch puzzles from target API" }, { status: 500 });
  }
}
