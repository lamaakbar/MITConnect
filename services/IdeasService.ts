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
  poll_id?: string;
  poll_question?: string;
  poll_options?: string[];
  poll_total_responses?: number;
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

export interface IdeaPoll {
  id: string;
  idea_id: string;
  question: string;
  options: string[] | string; // Can be array or JSON string
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active?: boolean;
  total_votes?: number;
}

export interface PollResponse {
  id: string;
  poll_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  selected_option: number;
  created_at: string;
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
   * Get all ideas for admin view (all statuses) with polls
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
      console.log(`🔍 Attempting to update idea ${ideaId} to status: ${status}`);
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id, 'Auth error:', authError);
      
      // First, check if the idea exists
      const { data: existingIdea, error: checkError } = await supabase
        .from('ideas')
        .select('id, status, title')
        .eq('id', ideaId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking idea existence:', checkError);
        return { data: null, error: checkError };
      }

      if (!existingIdea) {
        console.error(`❌ Idea with id ${ideaId} not found`);
        return { data: null, error: { message: 'Idea not found' } };
      }

      console.log(`✅ Found idea: ${existingIdea.title} (current status: ${existingIdea.status})`);

      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      // If approving, set approval fields
      if (status === 'Approved') {
        updateData.approved_by = adminId;
        updateData.approved_at = new Date().toISOString();
      }

      console.log('📝 Update data:', updateData);
      
      const { data, error } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', ideaId)
        .select();

      console.log('📊 Update result - data:', data, 'error:', error);

      if (error) {
        console.error('Error updating idea:', error);
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        console.error('❌ Update returned 0 rows - possible RLS policy issue');
        
        // Try a direct query to see if we can still access the idea
        const { data: recheckData, error: recheckError } = await supabase
          .from('ideas')
          .select('*')
          .eq('id', ideaId)
          .maybeSingle();
          
        console.log('🔍 Recheck after failed update:', recheckData, recheckError);
        
        return { data: null, error: { message: 'Update failed - no rows affected (possible permission issue)' } };
      }

      console.log(`✅ Successfully updated idea to status: ${data[0].status}`);
      return { data: data[0], error: null };
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
   * Create a poll for an idea
   */
  static async createPoll(pollData: {
    idea_id: string;
    question: string;
    options: string[];
  }): Promise<{ data: IdeaPoll | null; error: any }> {
    try {
      // Get current user for created_by field
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user for poll creation:', userError);
        return { data: null, error: 'User not authenticated' };
      }

      console.log('Creating poll with data:', {
        idea_id: pollData.idea_id,
        question: pollData.question,
        options: pollData.options,
        created_by: user.id
      });

      const { data, error } = await supabase
        .from('idea_polls')
        .insert([{
          idea_id: pollData.idea_id,
          question: pollData.question,
          options: JSON.stringify(pollData.options), // Convert to JSON string for JSONB
          created_by: user.id,
          is_active: true,
          total_votes: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error creating poll:', error);
        return { data: null, error };
      }

      console.log('Poll created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating poll:', error);
      return { data: null, error };
    }
  }

  /**
   * Get poll for an idea
   */
  static async getPollForIdea(ideaId: string): Promise<{ data: IdeaPoll | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('idea_polls')
        .select('*')
        .eq('idea_id', ideaId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching poll:', error);
      return { data: null, error };
    }
  }

  /**
   * Submit a poll response
   */
  static async submitPollResponse(responseData: {
    poll_id: string;
    user_id: string;
    user_name: string;
    user_role: string;
    selected_option: number;
  }): Promise<{ data: PollResponse | null; error: any }> {
    try {
      // Check if user already responded to this poll
      const { data: existingResponses, error: checkError } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', responseData.poll_id)
        .eq('user_id', responseData.user_id);

      if (checkError) {
        console.error('Error checking existing response:', checkError);
        return { data: null, error: checkError };
      }

      const existingResponse = existingResponses?.[0];

      if (existingResponse) {
        // Update existing response
        const { data, error } = await supabase
          .from('poll_responses')
          .update({
            selected_option: responseData.selected_option,
            created_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)
          .select();

        if (error) {
          console.error('Error updating poll response:', error);
          return { data: null, error };
        }

        return { data: data?.[0] || null, error: null };
      } else {
        // Create new response
        const { data, error } = await supabase
          .from('poll_responses')
          .insert([responseData])
          .select();

        if (error) {
          console.error('Error creating poll response:', error);
          return { data: null, error };
        }

        return { data: data?.[0] || null, error: null };
      }
    } catch (error) {
      console.error('Error submitting poll response:', error);
      return { data: null, error };
    }
  }

  /**
   * Get poll responses for a specific poll with option counts
   */
  static async getPollResults(pollId: string): Promise<{ 
    data: {
      total_responses: number;
      option_counts: { [key: number]: number };
      responses: PollResponse[];
    } | null; 
    error: any 
  }> {
    try {
      // Get all responses for this poll
      const { data: responses, error: responsesError } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false });

      if (responsesError) {
        return { data: null, error: responsesError };
      }

      // Calculate option counts
      const option_counts: { [key: number]: number } = {};
      responses?.forEach(response => {
        const option = response.selected_option;
        option_counts[option] = (option_counts[option] || 0) + 1;
      });

      return {
        data: {
          total_responses: responses?.length || 0,
          option_counts,
          responses: responses || []
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching poll results:', error);
      return { data: null, error };
    }
  }

  /**
   * Get poll responses for a poll
   */
  static async getPollResponses(pollId: string): Promise<{ data: PollResponse[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching poll responses:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a user's poll response for a specific poll
   */
  static async getUserPollResponse(pollId: string, userId: string): Promise<{ data: PollResponse | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error: any) {
      // If no response found, return null (not an error)
      if (error?.code === 'PGRST116') {
        return { data: null, error: null };
      }
      console.error('Error fetching user poll response:', error);
      return { data: null, error };
    }
  }

  /**
   * Test poll database connectivity and permissions
   */
  static async testPollDatabase(): Promise<{ success: boolean; details: any }> {
    try {
      console.log('🔍 Testing poll database connectivity...');
      
      // Test 1: Check if idea_polls table exists by trying to query it
      let tablesExist = true;
      let tablesError = null;
      
      try {
        await supabase.from('idea_polls').select('id').limit(0);
        console.log('✅ idea_polls table exists');
      } catch (error) {
        tablesExist = false;
        tablesError = error;
        console.log('❌ idea_polls table does not exist');
      }

      try {
        await supabase.from('poll_responses').select('id').limit(0);
        console.log('✅ poll_responses table exists');
      } catch (error) {
        tablesExist = false;
        tablesError = error;
        console.log('❌ poll_responses table does not exist');
      }

      // Test 2: Check user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('👤 User check:', { user: user?.id, userError });

      // Test 3: Try to read from idea_polls table
      const { data: pollsData, error: pollsError } = await supabase
        .from('idea_polls')
        .select('id')
        .limit(1);

      console.log('📊 Polls table read test:', { pollsData, pollsError });
      if (pollsError) console.error('❌ Polls error details:', pollsError);

      // Test 4: Check if user is admin
      if (user) {
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        console.log('🔐 User role check:', { userData, userDataError });
      }

      return {
        success: tablesExist && !userError && !pollsError,
        details: {
          tables: { exist: tablesExist, error: tablesError },
          user: { id: user?.id, error: userError },
          pollsAccess: { data: pollsData, error: pollsError }
        }
      };
    } catch (error) {
      console.error('❌ Database test failed:', error);
      return { success: false, details: { error } };
    }
  }

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