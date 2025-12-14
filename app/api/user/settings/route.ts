
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma client is exported from here
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { alarmSound } = body;

        if (!alarmSound) {
            return new NextResponse("Missing alarmSound", { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                alarmSound
            }
        });

        return NextResponse.json(user);

    } catch (error) {
        console.error("[USER_SETTINGS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
