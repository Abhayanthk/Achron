import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExcalidrawWrapper from "@/components/excalidraw-wrapper";

export default async function BrainstormPage({
  params,
}: {
  params: Promise<{ brainstormId: string }>;
}) {
  const { userId } = await auth();

  // We need to await params in Next.js 15+ if it's treated as a promise,
  // but in 14 it's an object. Assuming standard behavior for now.
  // However, keeping it safe by just accessing directly if it's already resolved.
  const { brainstormId } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const brainstorm = await prisma.brainstorm.findUnique({
    where: {
      id: brainstormId,
      project: {
        userId: userId,
      },
    },
  });

  if (!brainstorm) {
    return (
      <div className="flex h-screen items-center justify-center">
        Brainstorm not found
      </div>
    );
  }

  // Parse content safely
  let initialData = { elements: [], appState: {} };
  if (
    brainstorm.content &&
    typeof brainstorm.content === "object" &&
    !Array.isArray(brainstorm.content)
  ) {
    initialData = brainstorm.content as any;
  }

  return (
    <ExcalidrawWrapper initialData={initialData} brainstormId={brainstormId} />
  );
}
