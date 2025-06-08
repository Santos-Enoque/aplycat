import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { resumeData, targetRole, targetIndustry } = body;

    // For simplicity, I am assuming the first uploaded resume is the one to associate with.
    // In a real app, you'd have a more robust way of tracking this.
    const originalResume = await db.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!originalResume) {
      return new NextResponse("Original resume not found", { status: 404 });
    }

    const improvedResume = await db.improvedResume.create({
      data: {
        userId,
        resumeId: originalResume.id,
        version: 1, // Initial version
        targetRole,
        targetIndustry,
        improvedResumeData: resumeData,
        isTailored: false,
      },
    });

    return NextResponse.json(improvedResume, { status: 201 });
  } catch (error) {
    console.error("[IMPROVED_RESUME_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 