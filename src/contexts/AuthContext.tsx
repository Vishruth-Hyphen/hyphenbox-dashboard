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
    try {
      // Direct fetch method - more reliable than the Supabase client for cold starts
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[AUTH] Missing Supabase credentials');
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
      return data || [];
    } catch (e) {
      console.error('[AUTH] Error fetching organization memberships:', e);
      return [];
    }
  }, []);

  // Function to build session object with memberships
  const buildSessionWithMemberships = useCallback(async (supabaseSession: any) => {
    const userEmail = supabaseSession.user.email || '';
    const userId = supabaseSession.user.id;
    
    // Check if the user's email is in the super admin list
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);
    
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
    const memberships = await getOrganizationMemberships(userId);

    if (memberships.length > 0) {
      // Always use the first organization for regular users
      const orgId = memberships[0].organization_id;
      
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
      try {
        // First attempt - get session from Supabase
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (!supabaseSession?.user) {
          setSession(null);
          setIsLoading(false);
          return;
        }
        
        const sessionWithMemberships = await buildSessionWithMemberships(supabaseSession);
        setSession(sessionWithMemberships);
      } catch (e) {
        console.error('[AUTH] Error initializing session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize on component mount
    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, supabaseSession) => {
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