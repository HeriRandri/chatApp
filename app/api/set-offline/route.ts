// app/api/set-offline/route.ts
import { db } from "@/app/firebase/clientApp"; // ⚠️ admin SDK ici
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

  try {
    await updateDoc(doc(db, "users", uid), { isOnline: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
