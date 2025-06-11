import { ReactNode } from "react";

export default function ImproveV2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      {children}
    </div>
  );
}
