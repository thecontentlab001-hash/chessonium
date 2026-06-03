import { NextRequest, NextResponse } from "next/server";
import { getUserData, saveUserData } from "@/lib/db/cloudDb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    
    const data = getUserData(username);
    if (!data) {
      return NextResponse.json({ status: "not_found", message: "No data stored in cloud" });
    }
    
    return NextResponse.json({ status: "success", data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to query database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, state } = body;
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    
    const success = saveUserData(username, state);
    if (!success) {
      return NextResponse.json({ error: "Failed to save data to cloud database" }, { status: 500 });
    }
    
    return NextResponse.json({ status: "success", message: "Data synced to cloud successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Invalid request payload" }, { status: 500 });
  }
}
