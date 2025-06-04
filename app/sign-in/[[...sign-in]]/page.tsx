// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="text-4xl">🐱</span>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back to Aplycat
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to unlock your complete resume analysis
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn 
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
          New to Aplycat?{' '}
          <a href="/sign-up" className="font-medium text-purple-600 hover:text-purple-500">
            Create your free account
          </a>
        </p>
      </div>
    </div>
  );
}