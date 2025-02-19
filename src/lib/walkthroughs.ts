import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Walkthrough {
  id: string;
  title: string;
  markdown_url: string;
  created_at: string;
  status: 'processing' | 'completed' | 'failed';
  markdown_content?: string;
  session_id: string;
}

export class WalkthroughService {
  private supabase = createClientComponentClient();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  async fetchWalkthroughs(userId: string): Promise<Walkthrough[]> {
    const { data, error } = await this.supabase
      .from('walkthroughs_v2')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return await this.fetchMarkdownContent(data || []);
  }

  private async fetchMarkdownContent(walkthroughs: Walkthrough[]): Promise<Walkthrough[]> {
    return Promise.all(
      walkthroughs.map(async (walkthrough) => {
        if (walkthrough.status === 'completed' && walkthrough.markdown_url) {
          try {
            const response = await fetch(walkthrough.markdown_url);
            const markdown_content = await response.text();
            return { ...walkthrough, markdown_content };
          } catch (error) {
            console.error(`Error fetching markdown for ${walkthrough.id}:`, error);
          }
        }
        return walkthrough;
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

  startPolling(walkthrough: Walkthrough, onUpdate: (updated: Walkthrough) => void) {
    if (walkthrough.status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const { data, error } = await this.supabase
            .from('walkthroughs_v2')
            .select('*')
            .eq('id', walkthrough.id)
            .single();

          if (error) throw error;
          
          if (data.status !== 'processing') {
            const updatedWalkthrough = (await this.fetchMarkdownContent([data]))[0];
            onUpdate(updatedWalkthrough);
            this.stopPolling(walkthrough.id);
          } else {
            onUpdate(data);
          }
        } catch (error) {
          console.error('Polling error:', error);
          this.stopPolling(walkthrough.id);
        }
      }, 3000);

      this.pollingIntervals.set(walkthrough.id, interval);
    }
  }

  stopPolling(walkthroughId: string) {
    const interval = this.pollingIntervals.get(walkthroughId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(walkthroughId);
    }
  }

  cleanup() {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}

export const walkthroughService = new WalkthroughService(); 