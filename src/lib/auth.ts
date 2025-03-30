import { supabase } from './supabase';

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type UserMetadata = {
  email_verified?: boolean;
};

export type OrganizationMembership = {
  organization_id: string;
  role: string;
};

export type UserSession = {
  user: {
    id: string;
    email: string;
    is_super_admin: boolean;
  } | null;
  memberships: OrganizationMembership[];
  selectedOrganizationId: string | null;
};
