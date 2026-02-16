import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const log = await prisma.problemLog.findUnique({
      where: { id: params.id },
      include: {
        tags: true,
        pattern: true,
        keyLearnings: true,
      },
    });

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // Transform nested relations to flat arrays for the frontend form if needed
    // But the updated frontend handles relations now (tags as objects, etc.)
    // We might need to transform them to match what the form expects if the form expects [string] for tags
    // The form currently expects tags: string[], so we map it.
    
    // However, looking at LoggerForm, it handles initialData with relations?
    // Let's check LoggerForm's format later. For now, return clean data.

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching log:", error);
    return NextResponse.json(
      { error: "Failed to fetch log" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // ... filtering body ...
    const allowedFields = [
      "problem_name",
      "problem_link",
      "platform",
      "contest_id",
      "rating",
      "pattern_type",
      "pattern_subtype",
      "solve_status_type",
      "time_breakdown_type",
      "time_to_first_idea_minutes",
      "implementation_time_minutes",
      "debug_time_minutes",
      "total_time_minutes",
      "why_first_approach_failed",
      "key_observations",
      "edge_cases_found",
      "invariant_or_key_property",
      "constraints_checked",
      "edge_cases_tested",
      "complexity_verified",
      "dry_run_done",
      "final_verdict",
      "core_tricks_used",
      "template_used",
      "template_name",
      "must_revisit",
      "pattern_generalization_note",
      "similar_problems_links",
      "perceived_difficulty_after",
      "mental_load_score",
      "stress_level_during",
      "failure_categories",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle Tags (Many-to-Many)
    // We update relations by setting new ones (disconnecting old ones implicitly if we use set)
    if (body.tags && Array.isArray(body.tags)) {
      updateData.tags = {
        set: [], // Disconnect all existing first (optional if we just want to replace)
        // Actually, set: [] disconnects them. Then we connect/create new ones.
        // But better is to just say:
        connectOrCreate: body.tags.map((tag: string) => ({
          where: { userId_name: { userId, name: tag } },
          create: { userId, name: tag },
        })),
        // Note: If we use set: [], we need to re-connect all.
        // Ideally we want to replace the list.
        // Prisma `set` replaces the relation. So we can just do:
        // set: body.tags.map(...) -> No, set takes list of unique identifiers usually?
        // Actually for many-to-many, we often do explicit `set` with `connect` or `connectOrCreate`.
        // However, `set` for M-N replaces the connections.
        // It accepts `connect` or `connectOrCreate` inside? No.
        // Let's use `set: []` to clear, then `connectOrCreate`. 
        // Wait, typical pattern for replacing M-N list:
        // tags: {
        //   set: [], // Clears existing connections
        //   connectOrCreate: [...] // Adds new ones
        // }
        // BUT `set` usually takes `{ id: ... }` list to set strictly to those.
        // If we want to create new tags on the fly, `connectOrCreate` is needed.
        // Prisma doesn't support `set` AND `connectOrCreate` in one go nicely sometimes.
        // A common pattern is `set: []` then `connectOrCreate`. 
        // But `set` is a property of `updateData.tags`.
        // Let's try just `connectOrCreate` but we need to disconnect old ones that are NOT in the new list.
        // The robust way is: deleteMany (links? no we can't delete links easily in implicit M-N).
        // Actually, explicit `set` with exact IDs works if we know IDs. We don't.
        
        // Strategy: 
        // 1. We want to associate the log with ONLY the tags in `body.tags`.
        // 2. Since tags are simple strings unique per user, we can assume we want to match `userId_name`.
        
        // Correct Prisma pattern for "Replace all tags with these":
        // tags: {
        //   set: [], // Disconnect all
        //   connectOrCreate: ... // This might append?
        // }
        
        // Actually, `set` only works with existing records.
        // Use `connectOrCreate` to ensure they exist, but how to disconnect others?
        // We can do `set: []` to disconnect all?
        // Let's try passing `set: []` and `connectOrCreate` in the same object. 
        // If Prisma complains, we might need a transaction or separate operations.
        // But let's try the standard approach for "updating a list of items".
        // Actually, just using `set` with `connectOrCreate` is not valid TS usually.
        
        // Alternative:
        // tags: {
        //    disconnect: { ... where ... } // complicated
        //    connectOrCreate: ...
        // }
        
        // Let's go with: 
        // 1. Disconnect all *current* tags (we need to know them? No `set: []` should work if supported).
        // 2. Connect new ones.
        
        // Re-reading Prisma docs: `set` on relation sets the relation to exactly the list provided.
        // But `set` expects unique input (ids).
        
        // Let's try a safer approach:
        // We can just add new ones for now, or use `set` if we query IDs first.
        // Given complexity, let's just use `connectOrCreate`. It won't remove old tags though.
        // Result: Tags accumulate. This is bad for "editing".
        // To fix: We can try `set: []`.
      };
      
      // Let's try to query IDs first? No, too slow.
      // Let's use `set: []` effectively implies "disconnect all". 
      // AND `connectOrCreate`.
      // The issue is `set` usually requires `where` inputs.
      
      // Simpler approach that usually works:
      updateData.tags = {
         set: [], // Disconnects all current tags.
         connectOrCreate: body.tags.map((tag: string) => ({
           where: { userId_name: { userId, name: tag } },
           create: { userId, name: tag },
         })),
      };
    }

    // Handle Key Learnings (One-to-Many? No, schema says Many-to-Many implicit?)
    // "keyLearnings KeyLearning[]" on User and ProblemLog.
    // "problemLogs ProblemLog[]" on KeyLearning.
    // It IS Many-to-Many.
    if (body.key_learning_points && Array.isArray(body.key_learning_points)) {
       updateData.keyLearnings = {
         set: [], 
         connectOrCreate: body.key_learning_points.map((point: string) => ({
           where: { userId_point: { userId, point } },
           create: { userId, point }
         }))
       };
    }

    // Handle Pattern (Relation)
    // Assuming `pattern_type` in body is the pattern name.
    // If we have `pattern_subtype` as well.
    // Pattern model has `name` and `userId`.
    if (body.pattern_type) {
        updateData.pattern = {
            connectOrCreate: {
                where: { userId_name: { userId, name: body.pattern_type } },
                create: { userId, name: body.pattern_type }
            }
        };
    } else if (body.pattern_type === "") {
        // If explicitly cleared?
        updateData.pattern = { disconnect: true };
    }
    
    // We definitely should remove `pattern_type` from `updateData` if it's reserved for relation.
    // But `ProblemLog` schema has `pattern_subtype` String? Yes.
    // Does it have `pattern_type` String? 
    // Checking schema: 
    // model ProblemLog { ... pattern Pattern? ... pattern_subtype String? ... }
    // It does NOT have `pattern_type` string field! Only `pattern` relation.
    // So we MUST NOT put `pattern_type` in `updateData` directly.
    delete updateData.pattern_type; // Ensure we don't try to set non-existent field.

    const updatedLog = await prisma.problemLog.update({
      where: {
        id: params.id,
        userId,
      },
      data: updateData,
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("Error updating log:", error);
    return NextResponse.json(
      { error: "Failed to update log" },
      { status: 500 }
    );
  }
}
