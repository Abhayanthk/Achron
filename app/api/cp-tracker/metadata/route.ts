import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const [tags, patterns, keyLearnings] = await Promise.all([
      prisma.tag.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.pattern.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.keyLearning.findMany({
        where: { userId },
        orderBy: { point: "asc" },
      }),
    ]);

    return NextResponse.json({
      tags: tags.map((t) => ({ label: t.name, value: t.name })),
      patterns: patterns.map((p) => ({ label: p.name, value: p.name })),
      keyLearnings: keyLearnings.map((k) => ({
        label: k.point,
        value: k.point,
      })),
    });
  } catch (error) {
    console.error("[METADATA_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
