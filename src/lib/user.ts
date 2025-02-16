import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export class UserService {
  private supabase = createClientComponentClient();

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (error || !session) {
      console.error('Error getting session:', error);
      return null;
    }

    const { user } = session;
    
    return {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url
    };
  }
}

export const userService = new UserService(); 