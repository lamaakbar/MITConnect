import { supabase } from './supabase';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
  submitter_id: string;
  submitter_name: string;
  submitter_role: 'trainee' | 'employee' | 'admin';
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  yes_votes?: number;
  no_votes?: number;
  like_votes?: number;
  dislike_votes?: number;
  total_votes?: number;
  comment_count?: number;
}

export interface IdeaVote {
  id: string;
  idea_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  vote_type: 'yes' | 'no' | 'like' | 'dislike';
  created_at: string;
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

export class IdeasService {
  // ============ IDEAS MANAGEMENT ============
  
  /**
   * Submit a new idea to the database
   */
  static async submitIdea(ideaData: {
    title: string;
    description: string;
    category: string;
    submitter_id: string;
    submitter_name: string;
    submitter_role: 'trainee' | 'employee' | 'admin';
  }): Promise<{ data: Idea | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert([{
          title: ideaData.title,
          description: ideaData.description,
          category: ideaData.category,
          submitter_id: ideaData.submitter_id,
          submitter_name: ideaData.submitter_name,
          submitter_role: ideaData.submitter_role,
          status: 'Pending'
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error submitting idea:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all ideas with vote counts (using PostgreSQL function)
   */
  static async getAllIdeas(): Promise<{ data: Idea[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_ideas_with_votes');

      return { data, error };
    } catch (error) {
      console.error('Error fetching ideas:', error);
      return { data: null, error };
    }
  }

  /**
   * Get ideas for a specific user
   */
  static async getUserIdeas(userId: string): Promise<{ data: Idea[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('submitter_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching user ideas:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all ideas for admin view (all statuses)
   */
  static async getAdminIdeas(): Promise<{ data: Idea[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_ideas_with_votes');

      return { data, error };
    } catch (error) {
      console.error('Error fetching admin ideas:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an idea's status (admin only)
   */
  static async updateIdeaStatus(
    ideaId: string, 
    status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected',
    adminId: string
  ): Promise<{ data: Idea | null; error: any }> {
    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      // If approving, set approval fields
      if (status === 'Approved') {
        updateData.approved_by = adminId;
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', ideaId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating idea status:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete an idea (admin only)
   */
  static async deleteIdea(ideaId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId);

      return { error };
    } catch (error) {
      console.error('Error deleting idea:', error);
      return { error };
    }
  }

  // ============ VOTING MANAGEMENT ============
  
  /**
   * Submit a vote for an idea
   */
  static async submitVote(voteData: {
    idea_id: string;
    user_id: string;
    user_name: string;
    user_role: string;
    vote_type: 'yes' | 'no' | 'like' | 'dislike';
  }): Promise<{ data: IdeaVote | null; error: any }> {
    try {
      // First, check if user has already voted on this idea
      const { data: existingVote, error: checkError } = await supabase
        .from('idea_votes')
        .select('*')
        .eq('idea_id', voteData.idea_id)
        .eq('user_id', voteData.user_id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { data, error } = await supabase
          .from('idea_votes')
          .update({
            vote_type: voteData.vote_type,
            created_at: new Date().toISOString()
          })
          .eq('id', existingVote.id)
          .select()
          .single();

        return { data, error };
      } else {
        // Create new vote
        const { data, error } = await supabase
          .from('idea_votes')
          .insert([voteData])
          .select()
          .single();

        return { data, error };
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a user's vote for a specific idea
   */
  static async getUserVote(ideaId: string, userId: string): Promise<{ data: IdeaVote | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_votes')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching user vote:', error);
      return { data: null, error };
    }
  }

  /**
   * Get vote counts for a specific idea
   */
  static async getVoteCounts(ideaId: string): Promise<{ 
    data: { 
      yes_votes: number; 
      no_votes: number; 
      like_votes: number; 
      dislike_votes: number; 
      total_votes: number; 
    } | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_idea_vote_counts', { idea_uuid: ideaId });

      return { data: data?.[0] || null, error };
    } catch (error) {
      console.error('Error fetching vote counts:', error);
      return { data: null, error };
    }
  }

  // ============ COMMENTS MANAGEMENT ============
  
  /**
   * Add a comment to an idea
   */
  static async addComment(commentData: {
    idea_id: string;
    user_id: string;
    user_name: string;
    user_role: string;
    comment_text: string;
  }): Promise<{ data: IdeaComment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_comments')
        .insert([commentData])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all comments for an idea
   */
  static async getIdeaComments(ideaId: string): Promise<{ data: IdeaComment[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_comments')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a comment (user can only update their own)
   */
  static async updateComment(
    commentId: string, 
    commentText: string
  ): Promise<{ data: IdeaComment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_comments')
        .update({
          comment_text: commentText,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating comment:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a comment (user can only delete their own)
   */
  static async deleteComment(commentId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('idea_comments')
        .delete()
        .eq('id', commentId);

      return { error };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { error };
    }
  }

  // ============ STATISTICS ============
  
  /**
   * Get overall statistics for ideas
   */
  static async getIdeasStats(): Promise<{ 
    data: {
      totalIdeas: number;
      inProgress: number;
      approved: number;
      totalVotes: number;
      pendingIdeas: number;
      rejectedIdeas: number;
    } | null; 
    error: any 
  }> {
    try {
      // Get idea counts by status
      const { data: ideas, error: ideasError } = await supabase
        .from('ideas')
        .select('status');

      if (ideasError) {
        return { data: null, error: ideasError };
      }

      // Get total votes count
      const { count: totalVotes, error: votesError } = await supabase
        .from('idea_votes')
        .select('*', { count: 'exact', head: true });

      if (votesError) {
        return { data: null, error: votesError };
      }

      // Calculate statistics
      const stats = {
        totalIdeas: ideas.length,
        pendingIdeas: ideas.filter(i => i.status === 'Pending').length,
        inProgress: ideas.filter(i => i.status === 'In Progress').length,
        approved: ideas.filter(i => i.status === 'Approved').length,
        rejectedIdeas: ideas.filter(i => i.status === 'Rejected').length,
        totalVotes: totalVotes || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching ideas stats:', error);
      return { data: null, error };
    }
  }
} 