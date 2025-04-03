"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // If still loading, don't do anything yet
      if (isLoading) {
        return;
      }
      
      // No session after loading completed - redirect to login
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      // Session exists - proceed with routing logic
      
      // If super admin, redirect to org selection
      if (session.user?.is_super_admin) {
        router.push('/dashboard/organizations');
        return;
      }
      
      // Check for organization memberships - using data from context
      const memberships = session.memberships || [];
      
      if (memberships.length > 0) {
        // User has at least one organization
        if (memberships.length === 1) {
          // Single organization - should already be selected in context
          router.push('/dashboard/cursorflows');
        } else {
          // Multiple organizations - this should be rare for regular users
          router.push('/dashboard/cursorflows');
        }
      } else {
        // No organizations found
        router.push('/auth/login?error=no_organization');
      }
    };
    
    checkAuth();
  }, [session, isLoading, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div>Loading Dashboard...</div>
    </div>
  );
}