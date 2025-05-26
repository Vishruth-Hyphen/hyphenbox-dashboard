"use client";

import { useContext, useCallback, useState, useEffect } from 'react';
import { AuthContext } from '../contexts';
import { useRouter } from 'next/navigation';

// Create a custom event name for organization changes
const ORG_CHANGE_EVENT = 'organization-changed';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Custom hook for getting and managing organization context
 * Centralizes the organization ID retrieval logic that was duplicated across components
 */
export function useOrganization() {
  const { session } = useAuth();
  const router = useRouter();
  
  // Add local state to track organization
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [currentOrgName, setCurrentOrgName] = useState<string | null>(null);
  
  // Function to broadcast organization change
  const broadcastOrgChange = useCallback((orgId: string, orgName: string) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(ORG_CHANGE_EVENT, { 
        detail: { orgId, orgName } 
      });
      window.dispatchEvent(event);
    }
  }, []);
  
  /**
   * Switch to a different organization (for super admins)
   * Updates localStorage and broadcasts the change
   * @param orgId - The organization ID to switch to
   * @param orgName - The name of the organization
   */
  const switchOrganization = useCallback((orgId: string, orgName: string) => {
    if (typeof window !== 'undefined') {
      // Update localStorage
      localStorage.setItem('selectedOrganizationId', orgId);
      localStorage.setItem('selectedOrganizationName', orgName);
      
      // Update local state
      setCurrentOrgId(orgId);
      setCurrentOrgName(orgName);
      
      // Broadcast the change
      broadcastOrgChange(orgId, orgName);
    }
  }, [broadcastOrgChange]);
  
  /**
   * Get the current organization ID from session, component state, or localStorage
   * Prioritizes local state for super admins and session for regular users
   * @returns The current organization ID or null if not available
   */
  const getOrganizationId = useCallback(() => {
    // First check local state (which is kept in sync with localStorage & broadcasts)
    if (currentOrgId) return currentOrgId;
    
    // For regular users, use their selected organization from session
    if (session?.selectedOrganizationId) return session.selectedOrganizationId;
    
    // If session not loaded yet but user is logged in, check localStorage
    try {
      const savedOrgId = localStorage.getItem('selectedOrganizationId');
      if (savedOrgId) return savedOrgId;
    } catch (e) {
      console.error('Error reading selectedOrganizationId from localStorage:', e);
    }
    
    // If all else fails, redirect to org selection for super admin
    if (session?.user?.is_super_admin) {
      router.push('/dashboard/organizations');
      return null;
    }
    
    return null;
  }, [currentOrgId, session, router]);

  /**
   * Get the current organization name from component state or localStorage
   * @returns The current organization name or null if not available
   */
  const getOrganizationName = useCallback(() => {
    // First check local state
    if (currentOrgName) return currentOrgName;
    
    // Then fall back to localStorage
    try {
      return localStorage.getItem('selectedOrganizationName');
    } catch (e) {
      console.error('Error reading selectedOrganizationName from localStorage:', e);
      return null;
    }
  }, [currentOrgName]);

  /**
   * Check if the current user is a super admin
   * @returns boolean indicating if the user is a super admin
   */
  const isSuperAdmin = useCallback(() => {
    return !!session?.user?.is_super_admin;
  }, [session]);
  
  // Initialize from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedOrgId = localStorage.getItem('selectedOrganizationId');
        const savedOrgName = localStorage.getItem('selectedOrganizationName');
        
        if (savedOrgId) {
          setCurrentOrgId(savedOrgId);
        }
        
        if (savedOrgName) {
          setCurrentOrgName(savedOrgName);
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    }
  }, []);
  
  // Listen for organization change events
  useEffect(() => {
    const handleOrgChange = (event: CustomEvent) => {
      const { orgId, orgName } = event.detail;
      setCurrentOrgId(orgId);
      setCurrentOrgName(orgName);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener(ORG_CHANGE_EVENT, handleOrgChange as EventListener);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ORG_CHANGE_EVENT, handleOrgChange as EventListener);
      }
    };
  }, []);

  return {
    getOrganizationId,
    getOrganizationName,
    isSuperAdmin,
    switchOrganization,
    currentOrgId,
    currentOrgName
  };
}