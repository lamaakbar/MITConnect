import { supabase } from './supabase';

export interface IdeaLike {
  id: string;
  user_id: string;
  idea_id: string;
  liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdeaWithLikes {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  submitter_id: string;
  submitter_name: string;
  submitter_role: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  total_reactions: number;
  poll_id?: string;
  poll_question?: string;
  poll_options?: string[];
  poll_total_responses?: number;
  hasPoll?: boolean;
  poll?: {
    question: string;
    options: string[];
  };
}

export class IdeaLikesService {
  /**
   * Submit or update a user's reaction to an idea
   */
  static async submitReaction(
    userId: string,
    ideaId: string,
    liked: boolean,
    userName?: string,
    userRole?: string
  ): Promise<{ data: IdeaLike | null; error: any }> {
    try {
      // Use the existing idea_votes table with 'like' vote type for likes and 'dislike' for dislikes
      const voteType = liked ? 'like' : 'dislike';
      
      // Check if user already has a vote for this idea
      const { data: existingVote, error: checkError } = await supabase
        .from('idea_votes')
        .select('*')
        .eq('user_id', userId)
        .eq('idea_id', ideaId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no vote exists
        return { data: null, error: checkError };
      }

      let result;

      if (existingVote) {
        // Update existing vote
        const { data, error } = await supabase
          .from('idea_votes')
          .update({ 
            vote_type: voteType
          })
          .eq('user_id', userId)
          .eq('idea_id', ideaId)
          .select()
          .single();

        result = { data, error };
      } else {
        // Insert new vote
        const { data, error } = await supabase
          .from('idea_votes')
          .insert([{
            user_id: userId,
            idea_id: ideaId,
            vote_type: voteType,
            user_name: userName || 'Anonymous User',
            user_role: userRole || 'trainee'
          }])
          .select()
          .single();

        result = { data, error };
      }

      return result;
    } catch (error) {
      console.error('Error submitting reaction:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a user's reaction to a specific idea
   */
  static async getUserReaction(
    userId: string,
    ideaId: string
  ): Promise<{ data: IdeaLike | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_votes')
        .select('*')
        .eq('user_id', userId)
        .eq('idea_id', ideaId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { data: null, error };
      }

      // Transform the vote data to match our expected format
      if (data) {
        const transformedData = {
          id: data.id,
          user_id: data.user_id,
          idea_id: data.idea_id,
          liked: data.vote_type === 'like',
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        return { data: transformedData, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error getting user reaction:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all ideas with their like counts using the PostgreSQL function
   */
  static async getIdeasWithLikes(): Promise<{ data: IdeaWithLikes[] | null; error: any }> {
    try {
      // Use the existing function directly since the new one doesn't exist yet
      const { data: ideasData, error: ideasError } = await supabase
        .rpc('get_ideas_with_votes');

      if (ideasError) {
        console.error('Error fetching ideas with votes:', ideasError);
        return { data: null, error: ideasError };
      }

      // Transform the data to match our expected format
      const transformedData = ideasData?.map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        status: idea.status,
        submitter_id: idea.submitter_id,
        submitter_name: idea.submitter_name,
        submitter_role: idea.submitter_role,
        created_at: idea.created_at,
        likes_count: (idea.like_votes || 0) + (idea.yes_votes || 0),
        dislikes_count: (idea.dislike_votes || 0) + (idea.no_votes || 0),
        total_reactions: idea.total_votes || 0,
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching ideas with likes:', error);
      return { data: null, error };
    }
  }

  /**
   * Get like counts for a specific idea
   */
  static async getIdeaLikeCounts(ideaId: string): Promise<{ 
    data: { likes_count: number; dislikes_count: number; total_reactions: number } | null; 
    error: any 
  }> {
    try {
      // Use the existing function directly since the new one doesn't exist yet
      const { data: voteData, error: voteError } = await supabase
        .rpc('get_idea_vote_counts', { idea_uuid: ideaId });

      if (voteError) {
        console.error('Error fetching idea vote counts:', voteError);
        return { data: null, error: voteError };
      }

      const voteCounts = voteData?.[0];
      return { 
        data: {
          likes_count: (voteCounts?.like_votes || 0) + (voteCounts?.yes_votes || 0),
          dislikes_count: (voteCounts?.dislike_votes || 0) + (voteCounts?.no_votes || 0),
          total_reactions: voteCounts?.total_votes || 0,
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching idea like counts:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all reactions for a specific idea
   */
  static async getIdeaReactions(ideaId: string): Promise<{ data: IdeaLike[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_votes')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      // Transform the vote data to match our expected format
      const transformedData = data?.map(vote => ({
        id: vote.id,
        user_id: vote.user_id,
        idea_id: vote.idea_id,
        liked: vote.vote_type === 'like',
        created_at: vote.created_at,
        updated_at: vote.updated_at
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching idea reactions:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove a user's reaction to an idea
   */
  static async removeReaction(
    userId: string,
    ideaId: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_votes')
        .delete()
        .eq('user_id', userId)
        .eq('idea_id', ideaId);

      return { data, error };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { data: null, error };
    }
  }

  /**
   * Get overall statistics for idea reactions
   */
  static async getReactionStats(): Promise<{ 
    data: { total_reactions: number; total_likes: number; total_dislikes: number } | null; 
    error: any 
  }> {
    try {
      const { data, error } = await supabase
        .from('idea_votes')
        .select('vote_type');

      if (error) {
        return { data: null, error };
      }

      const stats = {
        total_reactions: data.length,
        total_likes: data.filter(vote => vote.vote_type === 'like').length,
        total_dislikes: data.filter(vote => vote.vote_type === 'dislike').length,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching reaction stats:', error);
      return { data: null, error };
    }
  }
} 