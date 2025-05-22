"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/ui/layouts/DashboardSidebar";
import HyphenBox from "../HyphenBox";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is loaded and user is not authenticated, redirect to login
    if (!isLoading && !session) {
      router.push("/auth/login");
    }
  }, [session, isLoading, router]);

  // Show a loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Render the DashboardSidebar and children only if authenticated
  return session ? (
    <DashboardSidebar>
      {/* Only render HyphenBox if we have a valid userId */}
      {session.user?.id && (
        <HyphenBox
          apiKey={process.env.NEXT_PUBLIC_HYPHENBOX_API_KEY || ""}
          userId={session.user.id}
          userName={session.user.email}
        />
      )}
      {children}
    </DashboardSidebar>
  ) : null;
} 