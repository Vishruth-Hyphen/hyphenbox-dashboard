"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true; // For cleanup

    const checkAuth = async () => {
      // If still loading, don't do anything yet
      if (isLoading) {
        return;
      }
      
      // No session after loading completed - redirect to login
      if (!session) {
        if (isMounted) router.replace('/auth/login');
        return;
      }
      
      // Session exists - proceed with routing logic
      
      // If super admin, redirect to org selection
      if (session.user?.is_super_admin) {
        if (isMounted) router.replace('/dashboard/organizations');
        return;
      }
      
      // Check for organization memberships - using data from context
      const memberships = session.memberships || [];
      
      if (memberships.length > 0) {
        // User has at least one organization
        // Using replace instead of push to avoid browser history stack issues
        if (isMounted) router.replace('/dashboard/cursorflows');
      } else {
        // No organizations found
        if (isMounted) router.replace('/auth/login?error=no_organization');
      }
    };
    
    // Start the check
    checkAuth();
    
    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
    };
  }, [session, isLoading, router]);

  // Show a more informative loading state
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mb-6 text-xl font-bold text-gray-800">Dashboard</h2>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full animate-pulse rounded-full bg-brand-600"></div>
          </div>
          <p className="mb-1 text-sm text-gray-700">
            {isLoading 
              ? "Loading your session..." 
              : session 
                ? "Session loaded, redirecting..." 
                : "No session found, redirecting to login..."}
          </p>
        </div>
      </div>
    </div>
  );
}