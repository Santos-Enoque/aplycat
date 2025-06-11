// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="text-4xl">🐱</span>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join Aplycat
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Get 10 free credits to analyze and improve your resume
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-purple-600 hover:bg-purple-700 text-sm normal-case",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
              },
            }}
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/sign-in"
            className="font-medium text-purple-600 hover:text-purple-500"
          >
            Sign in here
          </a>
        </p>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            🎁 Welcome Bonus - Experience the Full Journey:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 7 free credits to get started</li>
            <li>• 1× Resume Analysis (1 credit)</li>
            <li>• 1× Resume Improvement (2 credits)</li>
            <li>• 1× Job-Tailored Resume + Cover Letter (3 credits)</li>
            <li>• 1 bonus credit for flexibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
