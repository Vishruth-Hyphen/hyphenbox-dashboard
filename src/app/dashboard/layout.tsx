"use client";

import { DashboardSidebar } from "@/ui/layouts/DashboardSidebar";
import HyphenBox from "@/app/HyphenBox";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const userName = session?.user?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Simple Hyphenbox integration - just one component! */}
      {userId && process.env.NEXT_PUBLIC_HYPHENBOX_API_KEY && (
        <HyphenBox 
          apiKey={process.env.NEXT_PUBLIC_HYPHENBOX_API_KEY} 
          userId={userId} 
          userName={userName}
          useDefaultLauncher={true} // Shows "Help & Guides" button automatically
          debug={true}
        />
      )}
      
      <DashboardSidebar>
        {children}
      </DashboardSidebar>
    </>
  );
} 