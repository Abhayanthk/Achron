import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { updateCoreItem } from "@/lib/daily-log/repository";
import { updateCoreItemSchema } from "@/lib/daily-log/schemas";

export const runtime = "nodejs";

/**
 * Rename, reorder or soft-disable a core item.
 *
 * There is no DELETE. Items are disabled, never removed, so the cards that
 * referenced them keep their meaning — and the database backs that up with an
 * `onDelete: Restrict` on the foreign key.
 */
export async function PATCH(
      req: NextRequest,
      props: { params: Promise<{ id: string }> },
) {
      const { userId } = await auth();
      if (!userId) return new NextResponse("Unauthorized", { status: 401 });

      try {
            const parsed = updateCoreItemSchema.safeParse(await req.json());
            if (!parsed.success) {
                  return NextResponse.json(
                        { error: "Invalid request data", issues: z.treeifyError(parsed.error) },
                        { status: 400 },
                  );
            }

            const { id } = await props.params;
            const updated = await updateCoreItem(userId, id, parsed.data);
            // null covers both "no such item" and "not yours" - same answer either way.
            if (!updated) return new NextResponse("Not found", { status: 404 });

            return NextResponse.json(updated);
      } catch (error) {
            console.error("[CORE_ITEMS_PATCH]", error);
            return new NextResponse("Internal Error", { status: 500 });
      }
}
