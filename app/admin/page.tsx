// app/admin/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Lock } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // Check if user has admin role
      console.log("[ADMIN_PAGE] User debug:", {
        id: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        publicMetadata: user?.publicMetadata,
        organizationMemberships: user?.organizationMemberships,
      });

      const isAdmin = !!(
        (
          user?.publicMetadata?.role === "admin" ||
          user?.organizationMemberships?.some(
            (membership: any) => membership.role === "admin"
          ) ||
          true
        ) // TEMPORARY: Allow all users for development
      );

      console.log("[ADMIN_PAGE] Is admin:", isAdmin);

      setHasAccess(isAdmin);
      setChecking(false);

      // Redirect non-admin users after a brief delay
      if (!isAdmin) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    }
  }, [isLoaded, user, router]);

  // Show loading state while checking auth
  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-4">
                You don't have permission to access the admin dashboard. Admin
                role is required.
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Redirecting to dashboard...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show admin dashboard for authorized users
  return <AdminDashboard />;
}
