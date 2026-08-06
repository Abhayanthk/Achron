import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DailyLogClient } from "@/components/daily-log/DailyLogClient";

export const metadata = {
      title: "Daily Log",
};

export default async function DailyLogPage() {
      const { userId } = await auth();
      if (!userId) redirect("/sign-in");

      return (
            <div className="h-full overflow-y-auto p-6">
                  <DailyLogClient />
            </div>
      );
}
