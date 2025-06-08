import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ResumeViewer } from "@/components/resume-viewer";
import { notFound } from "next/navigation";

async function getImprovedResume(id: string, userId: string) {
  const resume = await db.improvedResume.findUnique({
    where: {
      id: id,
      userId: userId,
    },
  });

  if (!resume) {
    notFound();
  }

  // The 'improvedResumeData' is a JSON field, so we need to parse it.
  // However, Prisma should handle this automatically. If not, we might need:
  // if (typeof resume.improvedResumeData === 'string') {
  //   resume.improvedResumeData = JSON.parse(resume.improvedResumeData);
  // }

  return resume;
}

export default async function ResumePage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = auth();

  if (!userId) {
    // This should be handled by middleware, but as a fallback
    return <div>Please sign in to view this page.</div>;
  }

  const resume = await getImprovedResume(params.id, userId);

  return <ResumeViewer initialResume={resume} />;
}
