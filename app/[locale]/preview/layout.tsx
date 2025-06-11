import { Suspense } from "react";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold mb-2">Loading...</h3>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
