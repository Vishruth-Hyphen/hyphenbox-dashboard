"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    const checkAuth = async () => {
      // If still loading, don't do anything yet
      if (isLoading) {
        setDebugInfo('Loading authentication state...');
        return;
      }
      
      // Log the state for debugging
      console.log('Session from useAuth:', session);
      console.log('User data:', session?.user);
      
      // No session after loading completed - redirect to login
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/auth/login');
        return;
      }
      
      // Session exists - proceed with routing logic
      
      // If super admin, redirect to org selection
      if (session.user?.is_super_admin) {
        console.log('Redirecting super admin to organizations');
        router.push('/dashboard/organizations');
        return;
      }
      
      // Check for organization memberships - using data from context
      const memberships = session.memberships || [];
      console.log('User memberships from context:', memberships);
      
      if (memberships.length > 0) {
        // User has at least one organization
        if (memberships.length === 1) {
          // Single organization - should already be selected in context
          const orgId = session.selectedOrganizationId;
          console.log(`Using organization from context: ${orgId}`);
          router.push('/dashboard/cursorflows');
        } else {
          // Multiple organizations - this should be rare for regular users
          console.log('Multiple organizations found in context:', memberships);
          router.push('/dashboard/cursorflows');
        }
      } else {
        // No organizations found
        console.log('No organizations found for user');
        setDebugInfo(`No organizations for this user`);
        router.push('/auth/login?error=no_organization');
      }
    };
    
    checkAuth();
  }, [session, isLoading, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div>Loading Dashboard...</div>
      <div className="mt-4 text-sm text-gray-500">{debugInfo}</div>
      <button 
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        onClick={() => {
          // Only use context data, don't query Supabase directly
          setDebugInfo(JSON.stringify({
            sessionExists: session ? true : false,
            isLoading,
            user: session?.user?.email,
            is_super_admin: session?.user?.is_super_admin,
            selectedOrganizationId: session?.selectedOrganizationId,
            memberships: session?.memberships || []
          }, null, 2));
        }}
      >
        Debug Session
      </button>
    </div>
  );
}