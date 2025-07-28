import { supabase } from './supabase';

export interface ChecklistProgressItem {
  id?: string;
  user_id?: string;
  checklist_item_index: number;
  checklist_item_name: string;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class ChecklistProgressService {
  /**
   * Get the authenticated user ID
   */
  private async getAuthenticatedUserId(): Promise<string | null> {
    try {
      console.log('🔍 Getting authenticated user ID for checklist...');
      
      // Try getSession first (reads from AsyncStorage)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
      } else if (session?.user?.id) {
        console.log('✅ User found via getSession:', session.user.id);
        return session.user.id;
      } else {
        console.log('ℹ️ No session found, trying getUser...');
      }

      // Fallback to getUser
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          if (authError.name === 'AuthSessionMissingError') {
            console.log('No session: user not logged in.');
          } else {
            console.error('❌ getUser error:', authError);
          }
          return null;
        }

        if (user?.id) {
          console.log('✅ User found via getUser:', user.id);
          return user.id;
        }
      } catch (getUserError) {
        console.error('❌ getUser exception:', getUserError);
      }

      console.log('❌ No authenticated user found');
      return null;
    } catch (error) {
      console.error('❌ Error getting authenticated user ID:', error);
      return null;
    }
  }

  /**
   * Load the checklist progress for the current user
   */
  async loadChecklistProgress(): Promise<boolean[]> {
    try {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        console.log('❌ Cannot load checklist progress: no authenticated user');
        return [];
      }

      console.log('🔄 Loading checklist progress for user:', userId);

      const { data, error } = await supabase
        .from('trainee_checklist_progress')
        .select('*')
        .eq('user_id', userId)
        .order('checklist_item_index', { ascending: true });

      if (error) {
        console.error('❌ Error loading checklist progress:', error);
        return [];
      }

      console.log('✅ Loaded checklist progress:', data);

      // Convert the database records to a boolean array
      // We need to handle the case where some items might not exist in the database yet
      const progressArray: boolean[] = [];
      
      // Assuming we have 6 checklist items (based on CHECKLIST_ITEMS.length)
      for (let i = 0; i < 6; i++) {
        const item = data?.find(record => record.checklist_item_index === i);
        progressArray[i] = item ? item.is_completed : false;
      }

      return progressArray;
    } catch (error) {
      console.error('❌ Error loading checklist progress:', error);
      return [];
    }
  }

  /**
   * Save progress for a specific checklist item
   */
  async saveChecklistItemProgress(
    itemIndex: number, 
    itemName: string, 
    isCompleted: boolean
  ): Promise<boolean> {
    try {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        console.log('❌ Cannot save checklist progress: no authenticated user');
        return false;
      }

      console.log('💾 Saving checklist progress:', {
        userId,
        itemIndex,
        itemName,
        isCompleted
      });

      const progressData: Partial<ChecklistProgressItem> = {
        user_id: userId,
        checklist_item_index: itemIndex,
        checklist_item_name: itemName,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
      };

      // Use upsert to either insert or update existing record
      const { data, error } = await supabase
        .from('trainee_checklist_progress')
        .upsert(progressData, {
          onConflict: 'user_id,checklist_item_index'
        })
        .select();

      if (error) {
        console.error('❌ Error saving checklist progress:', error);
        return false;
      }

      console.log('✅ Checklist progress saved successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error saving checklist progress:', error);
      return false;
    }
  }

  /**
   * Save the entire checklist progress array
   */
  async saveAllChecklistProgress(
    progressArray: boolean[], 
    checklistItems: string[]
  ): Promise<boolean> {
    try {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        console.log('❌ Cannot save checklist progress: no authenticated user');
        return false;
      }

      console.log('💾 Saving entire checklist progress:', progressArray);

      // Create records for all items
      const progressRecords: Partial<ChecklistProgressItem>[] = progressArray.map((isCompleted, index) => ({
        user_id: userId,
        checklist_item_index: index,
        checklist_item_name: checklistItems[index] || `Item ${index}`,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
      }));

      // Use upsert to handle all records at once
      const { data, error } = await supabase
        .from('trainee_checklist_progress')
        .upsert(progressRecords, {
          onConflict: 'user_id,checklist_item_index'
        })
        .select();

      if (error) {
        console.error('❌ Error saving all checklist progress:', error);
        return false;
      }

      console.log('✅ All checklist progress saved successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error saving all checklist progress:', error);
      return false;
    }
  }

  /**
   * Reset all checklist progress for the current user
   */
  async resetChecklistProgress(): Promise<boolean> {
    try {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        console.log('❌ Cannot reset checklist progress: no authenticated user');
        return false;
      }

      console.log('🗑️ Resetting checklist progress for user:', userId);

      const { error } = await supabase
        .from('trainee_checklist_progress')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error resetting checklist progress:', error);
        return false;
      }

      console.log('✅ Checklist progress reset successfully');
      return true;
    } catch (error) {
      console.error('❌ Error resetting checklist progress:', error);
      return false;
    }
  }

  /**
   * Get completion statistics for the current user
   */
  async getProgressStats(): Promise<{
    totalItems: number;
    completedItems: number;
    completionPercentage: number;
  }> {
    try {
      const progressArray = await this.loadChecklistProgress();
      const completedItems = progressArray.filter(Boolean).length;
      const totalItems = progressArray.length;
      const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return {
        totalItems,
        completedItems,
        completionPercentage
      };
    } catch (error) {
      console.error('❌ Error getting progress stats:', error);
      return {
        totalItems: 0,
        completedItems: 0,
        completionPercentage: 0
      };
    }
  }
}

// Export singleton instance
export const checklistProgressService = new ChecklistProgressService(); 