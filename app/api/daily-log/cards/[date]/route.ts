import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { today } from "@/lib/daily-log/date";
import { editabilityOf } from "@/lib/daily-log/domain";
import { getCardByDate } from "@/lib/daily-log/repository";
import { calendarDateSchema } from "@/lib/daily-log/schemas";

export const runtime = "nodejs";

/**
 * One day's card, for opening a heatmap cell.
 *
 * Returns `editability` alongside it so the client never has to decide on its
 * own whether the day can still be written to — that answer comes from the
 * server's clock, same as the write path uses.
 */
export async function GET(
      _req: NextRequest,
      props: { params: Promise<{ date: string }> },
) {
      const { userId } = await auth();
      if (!userId) return new NextResponse("Unauthorized", { status: 401 });

      const parsed = calendarDateSchema.safeParse((await props.params).date);
      if (!parsed.success) {
            return new NextResponse("Invalid date", { status: 400 });
      }

      try {
            const date = parsed.data;
            const currentDay = today();

            return NextResponse.json({
                  date,
                  card: await getCardByDate(userId, date),
                  editability: editabilityOf(date, currentDay),
            });
      } catch (error) {
            console.error("[DAILY_LOG_CARD_GET]", error);
            return new NextResponse("Internal Error", { status: 500 });
      }
}
