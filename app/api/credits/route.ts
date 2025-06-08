import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { userId } = auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: {
                clerkId: userId,
            },
            select: {
                credits: true,
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json({ credits: user.credits });
    } catch (error) {
        console.error("[CREDITS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
} 