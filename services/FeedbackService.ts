import { supabase } from './supabase';

// Database-matching type for trainee feedback with file support
export interface TraineeFeedback {
  id: string;
  trainee_id: string;
  trainee_name: string;
  feedback_text: string; // Changed from 'text' to match database column
  rating: number;
  submission_date: string; // Changed from 'date' to match database column
  created_at?: string; // Optional fallback
  // File fields (nullable)
  file_name?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  storage_path?: string | null;
  uploaded_at?: string | null;
}

// Input type for creating new feedback
export interface CreateFeedbackInput {
  feedback_text: string;
  rating: number;
  trainee_name?: string; // Optional, can be derived from user profile
  file?: File; // Optional single file to upload
}

// Response type for service operations
export interface FeedbackServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export class FeedbackService {
  /**
   * Upload file to Supabase storage and return file data
   */
  static async uploadFile(file: File, userId: string): Promise<{ fileData: any; error: string | null }> {
    try {
      // Validate file
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return { fileData: null, error: 'File size must be less than 50MB.' };
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        return { fileData: null, error: 'File type not allowed. Please upload PDF, Word document, text file, or image.' };
      }

      // Generate unique file path
      const timestamp = new Date().getTime();
      const fileName = `${userId}/${timestamp}_${file.name}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trainee-feedback-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return { fileData: null, error: 'Failed to upload file. Please try again.' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trainee-feedback-files')
        .getPublicUrl(fileName);

      // Return file data to be saved with feedback
      return {
        fileData: {
          file_name: file.name,
          file_path: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          storage_path: fileName,
          uploaded_at: new Date().toISOString()
        },
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in uploadFile:', error);
      return { fileData: null, error: 'An unexpected error occurred while uploading file.' };
    }
  }

  /**
   * Submit new feedback to the database with optional file upload
   */
  static async submitFeedback(input: CreateFeedbackInput): Promise<FeedbackServiceResponse<TraineeFeedback>> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          data: null,
          error: 'User not authenticated. Please log in and try again.'
        };
      }

      // Get user profile data if trainee_name not provided
      let traineeName = input.trainee_name;
      if (!traineeName) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, first_name, last_name')
          .eq('id', user.id)
          .single();
        
        traineeName = profile?.full_name || 
                     `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                     user.email?.split('@')[0] ||
                     'Anonymous User';
      }

      // Validate input
      if (!input.feedback_text || input.feedback_text.trim().length < 10) {
        return {
          data: null,
          error: 'Feedback text must be at least 10 characters long.'
        };
      }

      if (input.feedback_text.trim().length > 2000) {
        return {
          data: null,
          error: 'Feedback text must be less than 2000 characters.'
        };
      }

      if (!input.rating || input.rating < 1 || input.rating > 5) {
        return {
          data: null,
          error: 'Rating must be between 1 and 5 stars.'
        };
      }

      // Handle file upload if provided
      let fileData = null;
      if (input.file) {
        const uploadResult = await this.uploadFile(input.file, user.id);
        if (uploadResult.error) {
          return {
            data: null,
            error: uploadResult.error
          };
        }
        fileData = uploadResult.fileData;
      }

      // Prepare data for insertion (matches your table structure)
      const insertData = {
        trainee_id: user.id,
        trainee_name: traineeName,
        feedback_text: input.feedback_text.trim(),
        rating: input.rating,
        submission_date: new Date().toISOString().split('T')[0],
        // Include file data if available
        ...(fileData && {
          file_name: fileData.file_name,
          file_path: fileData.file_path,
          file_size: fileData.file_size,
          file_type: fileData.file_type,
          storage_path: fileData.storage_path,
          uploaded_at: fileData.uploaded_at
        })
      };
      
      console.log('Inserting feedback data:', insertData);

      // Insert feedback into database
      const { data, error } = await supabase
        .from('trainee_feedback')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert result - data:', data);
      console.log('Insert result - error:', error);

      if (error) {
        console.error('Database error when submitting feedback:', error);
        
        // If file was uploaded but feedback failed, clean up the file
        if (fileData && fileData.storage_path) {
          await supabase.storage
            .from('trainee-feedback-files')
            .remove([fileData.storage_path]);
        }
        
        return {
          data: null,
          error: error.message || error.hint || 'Database connection failed. Please check your Supabase configuration.'
        };
      }

      return {
        data: data as TraineeFeedback,
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in submitFeedback:', error);
      return {
        data: null,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Get all feedback entries (for the "Previous Feedbacks" section)
   * Returns newest first
   */
  static async getAllFeedback(): Promise<FeedbackServiceResponse<TraineeFeedback[]>> {
    try {
      const { data, error } = await supabase
        .from('trainee_feedback')
        .select('*')
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('Database error when fetching all feedback:', error);
        return {
          data: null,
          error: 'Failed to load feedback. Please try again later.'
        };
      }

      return {
        data: data as TraineeFeedback[],
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in getAllFeedback:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while loading feedback.'
      };
    }
  }

  /**
   * Get feedback for the current user only
   */
  static async getUserFeedback(): Promise<FeedbackServiceResponse<TraineeFeedback[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          data: null,
          error: 'User not authenticated.'
        };
      }

      const { data, error } = await supabase
        .from('trainee_feedback')
        .select('*')
        .eq('trainee_id', user.id)
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('Database error when fetching user feedback:', error);
        return {
          data: null,
          error: 'Failed to load your feedback. Please try again later.'
        };
      }

      return {
        data: data as TraineeFeedback[],
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in getUserFeedback:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while loading your feedback.'
      };
    }
  }

  /**
   * Update existing feedback (if user wants to modify their submission)
   */
  static async updateFeedback(
    feedbackId: string, 
    updates: Partial<CreateFeedbackInput>
  ): Promise<FeedbackServiceResponse<TraineeFeedback>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          data: null,
          error: 'User not authenticated.'
        };
      }

      // Validate updates if provided
      if (updates.feedback_text !== undefined) {
        if (updates.feedback_text.trim().length < 10) {
          return {
            data: null,
            error: 'Feedback text must be at least 10 characters long.'
          };
        }
        if (updates.feedback_text.trim().length > 2000) {
          return {
            data: null,
            error: 'Feedback text must be less than 2000 characters.'
          };
        }
      }

      if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
        return {
          data: null,
          error: 'Rating must be between 1 and 5 stars.'
        };
      }

      // Prepare update data
      const updateData: any = {};
      if (updates.feedback_text !== undefined) {
        updateData.feedback_text = updates.feedback_text.trim();
      }
      if (updates.rating !== undefined) {
        updateData.rating = updates.rating;
      }

      // Update the feedback
      const { data, error } = await supabase
        .from('trainee_feedback')
        .update(updateData)
        .eq('id', feedbackId)
        .eq('trainee_id', user.id) // Ensure user can only update their own feedback
        .select()
        .single();

      if (error) {
        console.error('Database error when updating feedback:', error);
        return {
          data: null,
          error: 'Failed to update feedback. Please try again later.'
        };
      }

      return {
        data: data as TraineeFeedback,
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in updateFeedback:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while updating feedback.'
      };
    }
  }

  /**
   * Delete feedback (if user wants to remove their submission)
   */
  static async deleteFeedback(feedbackId: string): Promise<FeedbackServiceResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          data: null,
          error: 'User not authenticated.'
        };
      }

      const { error } = await supabase
        .from('trainee_feedback')
        .delete()
        .eq('id', feedbackId)
        .eq('trainee_id', user.id); // Ensure user can only delete their own feedback

      if (error) {
        console.error('Database error when deleting feedback:', error);
        return {
          data: null,
          error: 'Failed to delete feedback. Please try again later.'
        };
      }

      return {
        data: true,
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in deleteFeedback:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while deleting feedback.'
      };
    }
  }

  /**
   * Get feedback statistics (for admin dashboard)
   */
  static async getFeedbackStats(): Promise<FeedbackServiceResponse<{
    totalFeedbacks: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    recentFeedbacks: TraineeFeedback[];
  }>> {
    try {
      // Get all feedback for statistics
      const { data: allFeedback, error } = await supabase
        .from('trainee_feedback')
        .select('*')
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('Database error when fetching feedback stats:', error);
        return {
          data: null,
          error: 'Failed to load feedback statistics.'
        };
      }

      const feedbacks = allFeedback as TraineeFeedback[];
      
      // Calculate statistics
      const totalFeedbacks = feedbacks.length;
      const averageRating = totalFeedbacks > 0 
        ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedbacks 
        : 0;

      // Rating distribution
      const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbacks.forEach(feedback => {
        ratingDistribution[feedback.rating]++;
      });

      // Recent feedbacks (last 10)
      const recentFeedbacks = feedbacks.slice(0, 10);

      return {
        data: {
          totalFeedbacks,
          averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
          ratingDistribution,
          recentFeedbacks
        },
        error: null
      };

    } catch (error) {
      console.error('Unexpected error in getFeedbackStats:', error);
      return {
        data: null,
        error: 'An unexpected error occurred while loading statistics.'
      };
    }
  }
} 