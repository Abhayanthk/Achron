
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const nonNegotiable = await prisma.nonNegotiable.delete({
            where: {
                id,
                userId, // Ensure partial ownership check
            },
        });

        return NextResponse.json(nonNegotiable);

    } catch (error) {
        console.error('[NON_NEGOTIABLE_DELETE]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { date, action, title } = body; 
        // action: 'toggle', 'update_title'

        if (action === 'update_title') {
            const updated = await prisma.nonNegotiable.update({
                where: { id, userId },
                data: { title }
            });
            return NextResponse.json(updated);
        }

        if (action === 'toggle' && date) {
            // Fetch current to toggle
            const current = await prisma.nonNegotiable.findUnique({
                where: { id, userId }
            });

            if (!current) return new NextResponse("Not Found", { status: 404 });

            const targetDate = new Date(date).toISOString(); // Normalize to ISO string
            const exists = current.completedDates.some(d => d.toISOString() === targetDate);

            let updatedDates = [...current.completedDates];
            if (exists) {
                updatedDates = updatedDates.filter(d => d.toISOString() !== targetDate);
            } else {
                updatedDates.push(new Date(date));
            }

            const updated = await prisma.nonNegotiable.update({
                where: { id, userId },
                data: { completedDates: updatedDates }
            });
            return NextResponse.json(updated);
        }

        return new NextResponse("Invalid action", { status: 400 });

    } catch (error) {
        console.error('[NON_NEGOTIABLE_PUT]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
