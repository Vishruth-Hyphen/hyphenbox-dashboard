"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Organization = {
  id: string;
  name: string;
};

export default function OrganizationsPage() {
  const { session } = useAuth();
  const { switchOrganization } = useOrganization();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is super admin
    if (session && !session.user?.is_super_admin) {
      router.push('/dashboard/cursorflows');
      return;
    }
    
    async function fetchOrganizations() {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name');
          
        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganizations();
  }, [session, router]);

  const selectOrganization = async (org: Organization) => {
    try {
      // Use the switchOrganization function from the hook
      switchOrganization(org.id, org.name);
      
      // Navigate to the organization's dashboard
      router.push('/dashboard/cursorflows');
    } catch (error) {
      console.error('Error selecting organization:', error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading organizations...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Select Organization</h1>
      
      {organizations.length === 0 ? (
        <p>No organizations found. Please create one first.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <div 
              key={org.id}
              className="cursor-pointer rounded-lg border p-4 shadow-sm hover:shadow-md"
              onClick={() => selectOrganization(org)}
            >
              <h2 className="text-lg font-semibold">{org.name}</h2>
              <p className="text-sm text-gray-500">Click to access this organization</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 