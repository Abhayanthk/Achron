import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoggerForm } from "@/components/cp-tracker/LoggerForm";

export default async function ProblemLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) return redirect("/sign-in");

  const log = await prisma.problemLog.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      tags: true,
      pattern: true,
      keyLearnings: true,
    },
  });

  if (!log) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Log not found or access denied.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
            Problem Analysis
          </h1>
          <p className="text-zinc-500">View and refine your thoughts.</p>
        </div>
        <LoggerForm mode="view" initialData={log} />
      </div>
    </div>
  );
}
