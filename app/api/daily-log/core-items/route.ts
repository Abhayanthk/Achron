import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createCoreItem, listCoreItems } from "@/lib/daily-log/repository";
import { createCoreItemSchema } from "@/lib/daily-log/schemas";

export const runtime = "nodejs";

/** The spine. `?includeInactive=1` also returns soft-disabled items, for the editor. */
export async function GET(req: NextRequest) {
      const { userId } = await auth();
      if (!userId) return new NextResponse("Unauthorized", { status: 401 });

      try {
            const includeInactive =
                  req.nextUrl.searchParams.get("includeInactive") === "1";
            return NextResponse.json(await listCoreItems(userId, { includeInactive }));
      } catch (error) {
            console.error("[CORE_ITEMS_GET]", error);
            return new NextResponse("Internal Error", { status: 500 });
      }
}

export async function POST(req: NextRequest) {
      const { userId } = await auth();
      if (!userId) return new NextResponse("Unauthorized", { status: 401 });

      try {
            const parsed = createCoreItemSchema.safeParse(await req.json());
            if (!parsed.success) {
                  return NextResponse.json(
                        { error: "Invalid request data", issues: z.treeifyError(parsed.error) },
                        { status: 400 },
                  );
            }

            return NextResponse.json(await createCoreItem(userId, parsed.data.label));
      } catch (error) {
            console.error("[CORE_ITEMS_POST]", error);
            return new NextResponse("Internal Error", { status: 500 });
      }
}
