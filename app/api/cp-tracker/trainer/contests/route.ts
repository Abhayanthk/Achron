import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listCfContests } from "@/lib/cp-trainer/queries";

export const runtime = "nodejs";

/** Distinct CF contest_id values for the scope picker. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const contests = await listCfContests(userId);
  return NextResponse.json({ contests });
}
