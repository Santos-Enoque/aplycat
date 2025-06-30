import { EnhancedResumeLibrary } from "@/components/dashboard/resume-library/enhanced-resume-library";

export default function ResumesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedResumeLibrary />
        </div>
      </main>
    </div>
  );
}
