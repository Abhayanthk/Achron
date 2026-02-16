
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");

    const where: any = {
      userId,
    };

    if (platform) {
      where.platform = platform;
    }

    if (search) {
      where.OR = [
        { problem_name: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    const logs = await prisma.problemLog.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[CP_TRACKER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Basic validation could go here, but strict typing is handled by frontend and schema
    // Extract array/relation fields to handle them separately or via nested writes
    const {
      tags, // array of strings from form
      pattern_types, // array of strings (replacing single pattern_type)
      key_learning_points, // array of strings
      time_breakdown_type, // Explicitly extract to exclude from rest
      constraints_checked,
      edge_cases_tested,
      complexity_verified,
      dry_run_done,

      mistakes_text = "",
      learning_from_failure = "",
      edge_cases_found = "",
      invariant_or_key_property = "",
      pattern_generalization_note = "",
      ...rest
    } = body;

    // No single pattern upsert needed anymore, handled in create below

    const log = await prisma.problemLog.create({
        data: {
        ...rest,
        mistakes_text,
        learning_from_failure,
        edge_cases_found,
        invariant_or_key_property,
        pattern_generalization_note,
        userId,
        // Handle Pattern via ID
        // patterns: relation handled below
        // Handle Patterns (Find or Create each)
        patterns: {
          connectOrCreate: (pattern_types || []).map((pt: string) => ({
            where: {
              userId_name: {
                userId,
                name: pt,
              },
            },
            create: {
              name: pt,
              userId,
            },
          })),
        },
        // Handle Tags (Find or Create each)
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: {
              userId_name: {
                userId,
                name: tag,
              },
            },
            create: {
              name: tag,
              userId,
            },
          })),
        },
        // Handle Key Learnings (Find or Create each)
        keyLearnings: {
          connectOrCreate: key_learning_points.map((point: string) => ({
            where: {
              userId_point: {
                userId,
                point,
              },
            },
            create: {
              point,
              userId,
            },
          })),
        },
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("[CP_TRACKER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
