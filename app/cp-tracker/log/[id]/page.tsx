import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { LogDetails } from "@/components/cp-tracker/LogDetails";

// Force dynamic behavior since we use auth() and params
export const dynamic = "force-dynamic";

interface DetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProblemDetailsPage(props: DetailsPageProps) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const log = await prisma.problemLog.findUnique({
    where: {
      id: params.id,
      userId: userId, // Ensure ownership
    },
    include: {
      pattern: true,
      keyLearnings: true,
    },
  });

  if (!log) {
    redirect("/cp-tracker");
  }

  return <LogDetails log={log} />;
}
