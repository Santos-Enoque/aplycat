import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { resumeData, coverLetter, jobDescription } = body;

    const updatedResume = await db.improvedResume.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        improvedResumeData: resumeData,
        coverLetter: coverLetter,
        jobDescription: jobDescription,
        isTailored: true,
        version: { increment: 1 },
      },
    });

    return NextResponse.json(updatedResume);
  } catch (error) {
    console.error("[IMPROVED_RESUME_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 