import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { today } from "@/lib/daily-log/date";
import { BackfillWindowError, saveCard } from "@/lib/daily-log/repository";
import { saveCardSchema } from "@/lib/daily-log/schemas";
import { getDailyLogPageData } from "@/lib/daily-log/service";

export const runtime = "nodejs";

/** Everything the page renders, in one round trip. */
export async function GET() {
      const { userId } = await auth();
      if (!userId) return new NextResponse("Unauthorized", { status: 401 });

      try {
            return NextResponse.json(await getDailyLogPageData(userId));
      } catch (error) {
            console.error("[DAILY_LOG_GET]", error);
            return new NextResponse("Internal Error", { status: 500 });
      }
}

/**
 * Create or update one day's card.
 *
 * "Today" is resolved on the server: the backfill window would be trivially
 * bypassable if the client got to say what day it is.
 */
export async function POST(req: NextRequest) {
      const { userId } = await auth();
      if (!userId) return new NextResponse("Unauthorized", { status: 401 });

      try {
            const parsed = saveCardSchema.safeParse(await req.json());
            if (!parsed.success) {
                  return NextResponse.json(
                        { error: "Invalid request data", issues: z.treeifyError(parsed.error) },
                        { status: 400 },
                  );
            }

            const card = await saveCard(userId, parsed.data, today());
            return NextResponse.json(card);
      } catch (error) {
            if (error instanceof BackfillWindowError) {
                  // Refused, not malformed: the day is simply no longer editable.
                  return NextResponse.json(
                        { error: "That day is no longer editable", date: error.date },
                        { status: 403 },
                  );
            }
            console.error("[DAILY_LOG_POST]", error);
            return new NextResponse("Internal Error", { status: 500 });
      }
}
