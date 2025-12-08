import { inngest } from "./client";
import { prisma } from "@/lib/prisma";

export const syncUser = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  [
    { event: "clerk/user.created" },
    { event: "clerk/user.updated" },
    { event: "clerk/user.deleted" },
  ],
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
    const { id, email_addresses, first_name, last_name, image_url } = event.data;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name} ${last_name}`.trim();

    if (!email) {
        return { error: "No email found" };
    }

    const user = await step.run("upsert-user", async () => {
      return await prisma.user.upsert({
        where: { email: email },
        update: {
          name: name,
        },
        create: {
          id: id,
          email: email,
          name: name,
        },
      });
    });

    return { user };
  }
);
