import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Walkthrough {
  id: string;
  title: string;
  markdown_url: string;
  created_at: string;
  markdown_content?: string;
}

export class WalkthroughService {
  private supabase = createClientComponentClient();

  async fetchWalkthroughs(userId: string): Promise<Walkthrough[]> {
    const { data, error } = await this.supabase
      .from('walkthroughs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return await this.fetchMarkdownContent(data || []);
  }

  private async fetchMarkdownContent(walkthroughs: Walkthrough[]): Promise<Walkthrough[]> {
    return Promise.all(
      walkthroughs.map(async (walkthrough) => {
        try {
          const response = await fetch(walkthrough.markdown_url);
          const markdown_content = await response.text();
          return { ...walkthrough, markdown_content };
        } catch (error) {
          console.error(`Error fetching markdown for ${walkthrough.id}:`, error);
          return walkthrough;
        }
      })
    );
  }

  async deleteWalkthrough(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('walkthroughs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  downloadWalkthrough(walkthrough: Walkthrough): void {
    if (!walkthrough.markdown_content) return;

    const blob = new Blob([walkthrough.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${walkthrough.title || 'walkthrough'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const walkthroughService = new WalkthroughService(); 