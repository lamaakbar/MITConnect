// Event status types
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// Event type based on location
export type EventType = 'MITC' | 'Online' | 'Hybrid';

// Event category types - now allows any string
export type EventCategory = string;

// Main Event interface
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: any; // React Native image require
  category: EventCategory;
  registeredCount: number;
  featured: boolean;
  status: EventStatus;
  type: EventType;
  // Optional fields for future expansion
  maxCapacity?: number;
  organizer?: string;
  coverImage?: string; // For cover_image field
  tags?: string[];
  requirements?: string[];
  materials?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Event with user-specific data
export interface UserEvent extends Event {
  userStatus: 'registered' | 'attended' | 'missed' | 'bookmarked' | 'completed';
  registrationDate?: Date;
  attendanceDate?: Date;
  feedback?: EventFeedback;
}

// User event tracking interface
export interface UserEventTracking {
  eventId: string;
  userId: string;
  status: 'registered' | 'attended' | 'missed' | 'completed';
  registrationDate: Date;
  attendanceDate?: Date;
  feedbackSubmitted: boolean;
  feedbackDate?: Date;
}

// Event feedback interface
export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
  submittedAt: Date;
}

// Event registration interface
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registrationDate: Date;
  status: 'confirmed' | 'waitlist' | 'cancelled';
}

// Event bookmark interface
export interface EventBookmark {
  id: string;
  eventId: string;
  userId: string;
  createdAt: Date;
}

// Event statistics interface
export interface EventStats {
  totalRegistrations: number;
  totalAttendees: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Event filter interface
export interface EventFilters {
  status?: EventStatus;
  category?: EventCategory;
  type?: EventType;
  location?: string;
  search?: string;
  featured?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// Event creation/update interface (for admin)
export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  featured: boolean;
  maxCapacity?: number;
  organizer?: string;
  tags?: string[];
  requirements?: string[];
  materials?: string[];
}

// API response interfaces
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Event context state interface
export interface EventContextState {
  events: Event[];
  userEvents: UserEvent[];
  bookmarks: string[];
  registered: string[];
  loading: boolean;
  error: string | null;
}

// Event context actions interface
export interface EventContextActions {
  // Event operations
  fetchEvents: () => Promise<void>;
  fetchUserEvents: (userId: string) => Promise<void>;
  fetchEventById: (id: string) => Promise<Event | null>;
  
  // User operations
  registerEvent: (eventId: string, userId: string) => Promise<boolean>;
  unregisterEvent: (eventId: string, userId: string) => Promise<boolean>;
  bookmarkEvent: (eventId: string, userId: string) => Promise<boolean>;
  unbookmarkEvent: (eventId: string, userId: string) => Promise<boolean>;
  submitFeedback: (feedback: Omit<EventFeedback, 'id' | 'submittedAt'>) => Promise<boolean>;
  
  // Local state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Combined context interface
export interface EventContextType extends EventContextState, EventContextActions {} 