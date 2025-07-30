/**
 * Date utility functions to avoid timezone issues
 */

/**
 * Format a Date object to YYYY-MM-DD string without timezone conversion
 * This prevents the date from shifting backwards due to UTC conversion
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  date.setHours(0, 0, 0, 0); // Remove time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format without timezone issues
 */
export const getTodayYYYYMMDD = (): string => {
  const today = new Date();
  return formatDateToYYYYMMDD(today);
};

/**
 * Parse a date string and format it to YYYY-MM-DD
 * Handles various input formats safely
 */
export const parseAndFormatDate = (dateString: string): string | null => {
  try {
    const dateObj = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    return formatDateToYYYYMMDD(dateObj);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}; 