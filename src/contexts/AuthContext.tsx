"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserSession } from '../lib/auth';

// List of super admin emails
const SUPER_ADMIN_EMAILS = ['kushal@hyphenbox.com', 'mail2vishruth@gmail.com']; // Add your cofounder's email if needed

type OrganizationMembership = {
  organization_id: string;
  role: string;
};

export const AuthContext = createContext<{
  session: UserSession | null;
  isLoading: boolean;
}>({
  session: null,
  isLoading: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to get organization memberships for a user
  const getOrganizationMemberships = useCallback(async (userId: string): Promise<OrganizationMembership[]> => {
    console.log('[AUTH_DEBUG] Entering getOrganizationMemberships for userId:', userId);
    
    // NOTE: Complex retry logic has been simplified since we now force users through 
    // the login/callback flow, which handles authentication more reliably.
    try {
      console.log('[AUTH_DEBUG] Attempting Supabase query for organization_members...');
      
      // Direct fetch method - more reliable than the Supabase client for cold starts
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[AUTH_DEBUG] Missing Supabase URL or key');
        return [];
      }
      
      // Make direct fetch request to Supabase REST API
      const response = await fetch(
        `${supabaseUrl}/rest/v1/organization_members?user_id=eq.${userId}&select=organization_id,role`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AUTH_DEBUG] Fetch successful:', data);
      return data || [];
    } catch (e) {
      console.error('[AUTH_DEBUG] Exception in getOrganizationMemberships:', e);
      return [];
    } finally {
      console.log('[AUTH_DEBUG] Exiting getOrganizationMemberships');
    }
  }, []);

  // Function to build session object with memberships
  const buildSessionWithMemberships = useCallback(async (supabaseSession: any) => {
    const userEmail = supabaseSession.user.email || '';
    const userId = supabaseSession.user.id;
    
    console.log(`[AUTH] Building session for user: ${userEmail} (${userId})`);
    
    // Check if the user's email is in the super admin list
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);
    console.log(`[AUTH] User is super admin: ${isSuperAdmin}`);
    
    // Handle super admin users
    if (isSuperAdmin) {
      // Super admin might have a previously selected organization
      let selectedOrganizationId = null;
      if (typeof window !== 'undefined') {
        try {
          // Only check for selectedOrganizationId now
          selectedOrganizationId = localStorage.getItem('selectedOrganizationId');
        } catch (e) {
          console.error('[AUTH] Error reading from localStorage:', e);
        }
      }
      
      console.log(`[AUTH] Super admin session with selectedOrganizationId: ${selectedOrganizationId}`);
      return {
        user: {
          id: userId,
          email: userEmail,
          is_super_admin: true
        },
        memberships: [], // Super admin doesn't use memberships
        selectedOrganizationId
      };
    }

    // Handle regular users
    console.log('[AUTH] Regular user - fetching organization memberships');
    const memberships = await getOrganizationMemberships(userId);

    if (memberships.length > 0) {
      // Always use the first organization for regular users
      const orgId = memberships[0].organization_id;
      console.log(`[AUTH] Setting selectedOrganizationId to: ${orgId}`);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedOrganizationId', orgId);
      }
      
      return {
        user: {
          id: userId,
          email: userEmail,
          is_super_admin: false
        },
        memberships,
        selectedOrganizationId: orgId
      };
    }

    console.log('[AUTH] No memberships found for regular user');
    return {
      user: {
        id: userId,
        email: userEmail,
        is_super_admin: false
      },
      memberships: [],
      selectedOrganizationId: null
    };
  }, [getOrganizationMemberships]);

  useEffect(() => {
    const initSession = async () => {
      console.log('[AUTH] Initializing session');
      try {
        // First attempt - get session from Supabase
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (!supabaseSession?.user) {
          console.log('[AUTH] No authenticated user found');
          setSession(null);
          console.log('[AUTH_DEBUG] initSession: Setting isLoading = false (no user)');
          setIsLoading(false);
          return;
        }
        
        console.log('[AUTH] User authenticated, building session with memberships');
        const sessionWithMemberships = await buildSessionWithMemberships(supabaseSession);
        setSession(sessionWithMemberships);
      } catch (e) {
        console.error('[AUTH] Error initializing session:', e);
      } finally {
        console.log('[AUTH] Finished loading session');
        console.log('[AUTH_DEBUG] initSession: Setting isLoading = false (finally block)');
        setIsLoading(false);
      }
    };

    // Initialize on component mount
    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, supabaseSession) => {
        console.log('[AUTH] Auth state changed, updating session');
        console.log('[AUTH_DEBUG] onAuthStateChange: Setting isLoading = true');
        setIsLoading(true);
        
        try {
          if (supabaseSession?.user) {
            const sessionWithMemberships = await buildSessionWithMemberships(supabaseSession);
            setSession(sessionWithMemberships);
          } else {
            setSession(null);
          }
        } catch (e) {
          console.error('[AUTH] Error updating session:', e);
        } finally {
          console.log('[AUTH_DEBUG] onAuthStateChange: Setting isLoading = false (finally block)');
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [buildSessionWithMemberships]);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}