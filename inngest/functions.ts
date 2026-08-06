import { Prisma } from "@prisma/client";
import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { runTrainerAgent } from "@/lib/cp-trainer/agent";
import type { Scope } from "@/lib/cp-trainer/metrics";

export const syncUser = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [
      { event: "clerk/user.created" },
      { event: "clerk/user.updated" },
      { event: "clerk/user.deleted" },
    ],
  },
  async ({ event, step }) => {
    // Handle delete event
    if (event.name === "clerk/user.deleted") {
        const { id } = event.data;
        if (!id) return { error: "No user ID found for delete event" };

        await step.run("delete-user", async () => {
            await prisma.user.delete({
                where: { id },
            }).catch((err) => {
                // Ignore if user doesn't exist
                if (err.code !== 'P2025') throw err;
            });
        });
        return { deleted: true, id };
    }

    // Handle create/update events
    const { id, email_addresses, first_name, last_name, image_url, username } = event.data;
    const email = email_addresses[0]?.email_address;
    
    let fullName = `${first_name || ''} ${last_name || ''}`.trim();
    let name = username || fullName;

    if (!email) {
        return { error: "No email found" };
    }

    const user = await step.run("upsert-user", async () => {
      return await prisma.user.upsert({
        where: { email: email },
        update: {
          name: name,
          fullName: fullName,
        },
        create: {
          id: id,
          email: email,
          name: name,
          fullName: fullName,
        },
      });
    });

    return { user };
  }
);

/**
 * CP Trainer background analysis.
 *
 * Triggered by `cp-trainer/analyze.requested` (sent from the trainer POST route).
 * Runs the deterministic metrics + AgentKit agent loop, then persists the
 * CoachingReport onto the pre-created `TrainerReport` row.
 *
 * `runTrainerAgent` is called in the function body — NOT inside step.run —
 * because AgentKit creates its own durable steps (step.ai.infer per model call,
 * step.run for embeddings/finalize) and Inngest forbids nested steps. 429s from
 * the Gemini free tier surface as step failures and are absorbed by `retries`
 * with exponential backoff; `throttle` keeps concurrent Analyze clicks from
 * stampeding the 5-requests/minute quota.
 */
export const runTrainerAnalysis = inngest.createFunction(
  {
    id: "cp-trainer-analysis",
    retries: 4,
    throttle: { limit: 2, period: "1m" },
    triggers: [{ event: "cp-trainer/analyze.requested" }],
  },
  async ({ event, step }) => {
    const { reportId, userId, scope, contestId } = event.data as {
      reportId: string;
      userId: string;
      scope: Scope;
      contestId: string | null;
    };

    await step.run("mark-running", async () => {
      await prisma.trainerReport.update({
        where: { id: reportId },
        data: { status: "RUNNING" },
      });
    });

    try {
      const result = await runTrainerAgent(userId, scope, contestId);

      await step.run("persist-done", async () => {
        await prisma.trainerReport.update({
          where: { id: reportId },
          data: {
            status: "DONE",
            model: result.model,
            report: result.report as unknown as Prisma.InputJsonValue,
            metrics: result.metrics as unknown as Prisma.InputJsonValue,
            trace: result.trace as unknown as Prisma.InputJsonValue,
            error: null,
          },
        });
      });

      return { reportId, status: "DONE" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await step.run("persist-failed", async () => {
        await prisma.trainerReport.update({
          where: { id: reportId },
          data: { status: "FAILED", error: message },
        });
      });
      return { reportId, status: "FAILED", error: message };
    }
  },
);
