import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Walkthrough {
  id: string;
  title: string;
  markdown_url: string;
  created_at: string;
  markdown_content?: string;
  step_count?: number;
}

export class WalkthroughService {
  private supabase = createClientComponentClient();

  private countSteps(markdown: string): number {
    const stepMatches = markdown.match(/(?:^|\n)(?:##\s*)?Step\s+\d+/g);
    return stepMatches ? stepMatches.length : 0;
  }

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
          const step_count = this.countSteps(markdown_content);
          return { ...walkthrough, markdown_content, step_count };
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

  async renameWalkthrough(id: string, newTitle: string): Promise<void> {
    const { error } = await this.supabase
      .from('walkthroughs')
      .update({ title: newTitle })
      .eq('id', id);

    if (error) throw error;
  }
}

export const walkthroughService = new WalkthroughService(); 